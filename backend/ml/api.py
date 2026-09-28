import os
import time
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from predictor import CyclonePredictorNet
import copernicus_service

app = FastAPI(title="CycloneX ML & Copernicus API")

MODEL = None
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def _download_model_if_needed(model_path: str):
    """Download model checkpoint from MODEL_DOWNLOAD_URL if file not found locally."""
    if os.path.exists(model_path):
        print(f"[ML-API] Checkpoint found at {model_path}")
        return True
    download_url = os.environ.get("MODEL_DOWNLOAD_URL", "")
    if not download_url:
        print(f"[ML-API] Checkpoint not found and MODEL_DOWNLOAD_URL not set.")
        return False
    print(f"[ML-API] Downloading model from {download_url} ...")
    try:
        import requests
        r = requests.get(download_url, stream=True, timeout=120)
        r.raise_for_status()
        os.makedirs(os.path.dirname(os.path.abspath(model_path)), exist_ok=True)
        with open(model_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"[ML-API] Downloaded to {model_path} ({os.path.getsize(model_path)//1024//1024} MB)")
        return True
    except Exception as e:
        print(f"[ML-API] Download failed: {e}")
        return False

@app.on_event("startup")
def load_model():
    global MODEL
    model_path = os.environ.get("MODEL_PATH", r"D:\CycloneX\best_model.zip")
    print(f"[ML-API] Loading model from {model_path} onto {DEVICE}...")
    if not _download_model_if_needed(model_path):
        print("[ML-API] ERROR: Model file unavailable. Predictions will fail.")
        return
    try:
        model = CyclonePredictorNet()
        ckpt = torch.load(model_path, map_location=DEVICE, weights_only=False)
        if "model_state" in ckpt:
            model.load_state_dict(ckpt["model_state"])
        else:
            model.load_state_dict(ckpt)
        model.to(DEVICE)
        model.eval()
        MODEL = model
        print("[ML-API] Model loaded successfully.")
    except Exception as e:
        print(f"[ML-API] ERROR loading model: {e}")

@app.get("/health")
def health():
    copernicus_configured = bool(os.environ.get("COPERNICUSMARINE_SERVICE_USERNAME") and os.environ.get("COPERNICUSMARINE_SERVICE_PASSWORD"))
    return {
        "status": "ok" if MODEL is not None else "degraded",
        "model_loaded": MODEL is not None,
        "device": str(DEVICE),
        "model_name": "CyclonePredictorNet",
        "copernicus_configured": copernicus_configured
    }

class PredictRequest(BaseModel):
    track_sequence: list[list[float]]

@app.post("/predict")
def predict(req: PredictRequest):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")
    try:
        if len(req.track_sequence) != 9:
            raise HTTPException(status_code=400, detail="track_sequence must have exactly 9 timesteps")
        for step in req.track_sequence:
            if len(step) != 5:
                raise HTTPException(status_code=400, detail="Each timestep must have exactly 5 features")
        track_tensor = torch.tensor([req.track_sequence], dtype=torch.float32).to(DEVICE)
        image_tensor = torch.randn(1, 4, 201, 201).to(DEVICE)
        t0 = time.time()
        with torch.no_grad():
            preds = MODEL(image_tensor, track_tensor)
        t1 = time.time()
        cat_probs = torch.softmax(preds["category"], dim=1)
        pred_cat = torch.argmax(cat_probs, dim=1).item()
        return {
            "success": True,
            "inference_time_ms": round((t1 - t0) * 1000, 2),
            "predictions": {
                "wind": round(preds["wind"].item(), 2),
                "pressure": round(preds["pressure"].item(), 2),
                "delta_lat": round(preds["track"][0][0].item(), 4),
                "delta_lon": round(preds["track"][0][1].item(), 4),
                "category": pred_cat,
            },
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[ML-API] Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/ocean/sst")
def get_ocean_sst(lat: float = Query(16.9), lng: float = Query(83.6)):
    """Fetch analysed SST from Copernicus Marine service."""
    sst_data = copernicus_service.get_sst(lat=lat, lon=lng)
    return {
        "success": sst_data.get("status") == "LIVE",
        "data": sst_data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8001)))
