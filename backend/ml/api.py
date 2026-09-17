import os
import time
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from predictor import CyclonePredictorNet

app = FastAPI(title="CycloneX ML API")

# Global model state
MODEL = None
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

@app.on_event("startup")
def load_model():
    global MODEL
    model_path = os.environ.get('MODEL_PATH', r'D:\CycloneX\best_model.zip')
    print(f"[ML-API] Loading model from {model_path} onto {DEVICE}...")
    try:
        model = CyclonePredictorNet()
        ckpt = torch.load(model_path, map_location=DEVICE, weights_only=False)
        if 'model_state' in ckpt:
            model.load_state_dict(ckpt['model_state'])
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
    if MODEL is None:
        return {"status": "error", "message": "Model not loaded"}
    return {"status": "ok", "model": "CyclonePredictorNet", "device": str(DEVICE)}

class PredictRequest(BaseModel):
    # In a real scenario, this would take raw data to be converted into tensors.
    # For now, we simulate receiving parsed inputs (like the 9-step track).
    # We will just accept some basic flags to trigger the prediction and construct the dummy tensor internally for the prototype, 
    # OR we can accept the 9x5 track array. Let's accept the track array.
    track_sequence: list[list[float]] # Should be 9x5
    # image would be too large to pass as JSON typically, we might pass an ID or URL and fetch it.
    # For this local test, we'll just mock the image tensor internally if not provided.

@app.post("/predict")
def predict(req: PredictRequest):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")
    
    try:
        # Validate track sequence
        if len(req.track_sequence) != 9:
            raise HTTPException(status_code=400, detail="track_sequence must have exactly 9 timesteps")
        for step in req.track_sequence:
            if len(step) != 5:
                raise HTTPException(status_code=400, detail="Each timestep must have exactly 5 features")

        track_tensor = torch.tensor([req.track_sequence], dtype=torch.float32).to(DEVICE)
        
        # Mock image tensor (B, C, H, W) = (1, 4, 201, 201)
        image_tensor = torch.randn(1, 4, 201, 201).to(DEVICE)

        t0 = time.time()
        with torch.no_grad():
            preds = MODEL(image_tensor, track_tensor)
        t1 = time.time()

        cat_probs = torch.softmax(preds['category'], dim=1)
        pred_cat = torch.argmax(cat_probs, dim=1).item()

        return {
            "success": True,
            "inference_time_ms": round((t1 - t0) * 1000, 2),
            "predictions": {
                "wind": round(preds['wind'].item(), 2),
                "pressure": round(preds['pressure'].item(), 2),
                "delta_lat": round(preds['track'][0][0].item(), 4),
                "delta_lon": round(preds['track'][0][1].item(), 4),
                "category": pred_cat
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[ML-API] Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
