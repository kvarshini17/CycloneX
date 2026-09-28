# CycloneX

AI-Powered Cyclone Intelligence & Emergency Decision-Support System

**Smart India Hackathon 2026**  
**Problem Statement ID:** SIH26070  
**Theme:** Disaster Management  
**Category:** Software  
**Team:** The Apex Crew  

---

## 1. SIH Problem Statement
"To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data."

## 2. Overview
CycloneX is a multi-source cyclone intelligence and emergency decision-support platform. It unifies heterogeneous meteorological data sources (Copernicus Marine SST, Open-Meteo atmospheric soundings, NOAA IBTrACS historical best-track archives, and calibrated satellite imagery) into an end-to-end processing pipeline, performs neural network inference via a trained PyTorch model (`CyclonePredictorNet`), and translates meteorological predictions into localized emergency decision support.

---

## 3. End-to-End Pipeline
```
Multi-Source Data Ingestion
(Copernicus Marine SST, Open-Meteo, NOAA IBTrACS, Satellite)
               ↓
Preprocessing & Multi-Modal Feature Extraction
               ↓
PyTorch Neural Network (CyclonePredictorNet — SIH26070)
               ↓
Cyclone Classification & One-Step Movement/Intensity Prediction
               ↓
Localized Risk Assessment & Vulnerability Scoring
               ↓
Geospatial Visualization (2D Leaflet Map + 3D Earth Globe)
               ↓
AI Disaster Commander & What-If Scenario Simulator
```

---

## 4. Real Data & API Integrations

### A) Copernicus Marine Service (LIVE)
- **Product:** `METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2`
- **Variable:** `analysed_sst` (Daily high-resolution Sea Surface Temperature)
- **Usage:** Spatial bounding box (+/- 0.5°) queried around cyclone eye coordinates; extracts real SST in Kelvin and converts to Celsius.
- **Security:** Credentials (`COPERNICUSMARINE_SERVICE_USERNAME`, `COPERNICUSMARINE_SERVICE_PASSWORD`) are kept securely on the backend only; never exposed to the client browser or Git.
- **Fallback:** If Copernicus is unavailable or unconfigured, clearly returns `FALLBACK` or `OFFLINE` status without fabrication.

### B) Open-Meteo Public Weather API (LIVE)
- **Parameters:** 10m maximum sustained winds, wind gusts, central/surface pressure, 2m temperature, relative humidity.
- **Usage:** Proxied via backend `/api/data/weather` to avoid browser CORS and provide real-time coastal/marine atmospheric conditions.
- **Status:** Labeled `LIVE` when successfully fetched, or `AVAILABLE (SAMPLE)` / `FALLBACK` upon timeout.

### C) NOAA IBTrACS Best-Track Archive (AVAILABLE)
- **Dataset:** NOAA International Best Track Archive for Climate Stewardship (`ibtracs.NI.list.v04r01.csv`).
- **Usage:** Cached historical Bay of Bengal cyclones (Cyclone Michaung 2023, Fani 2019, Hudhud 2014, Amphan 2020, Mocha 2023) with observed coordinates, sustained winds, and central pressure curves for analog comparison.

### D) Satellite Imagery (HISTORICAL DEMO / CALIBRATED SAMPLE)
- **Imagery:** NASA GIBS (EOSDIS) calibrated multi-spectral frames (Terra/MODIS & Aqua/MODIS thermal IR and visible) for Cyclone Michaung (December 2023).
- **Transparency Notice:** Clearly identified as `HISTORICAL DEMO DATA` / `SAMPLE DATA`. Not claimed as a live INSAT-3DR operational feed.

---

## 5. AI / ML Architecture (CyclonePredictorNet)

The core AI model is a multi-modal deep learning architecture in PyTorch:

```
Satellite Image Input (4-channel, 201×201)
        ↓
ImageEncoder
  ├── Stem Conv (7×7, stride 2, padding 3) → 32ch
  ├── ConvBlock (32 → 64, stride 2) + Channel Attention (SE)
  ├── ConvBlock (64 → 128, stride 2) + Channel Attention (SE)
  ├── ConvBlock (128 → 256, stride 2) + Channel Attention (SE)
  ├── ConvBlock (256 → 256) + Channel Attention (SE)
  └── Adaptive Avg Pool → 256-dim feature representation

Historical Track Sequence (9 timesteps × 5 features: [lat, lon, wind, pres, hour])
        ↓
TrackEncoder
  ├── Bidirectional LSTM (2 layers, hidden 64, dropout 0.1)
  └── Linear projection → 128-dim feature representation

Feature Fusion & Prediction Heads
  ├── Concat [256 + 128] = 384-dim fused vector
  ├── Shared MLP: Linear(384 → 256) → LayerNorm → GELU → Dropout(0.2) → Linear(256 → 128)
  ├── Wind Speed Head: Linear(128 → 1)  → Predicted wind speed (km/h)
  ├── Pressure Head:   Linear(128 → 1)  → Predicted central pressure (hPa)
  ├── Track Movement:  Linear(128 → 2)  → One-step ΔLat, ΔLon
  └── Category Head:   Linear(128 → 7)  → 7-class IMD cyclone classification
```

- **Checkpoint:** Trained checkpoint (`best_model.zip`, 31.7 MB, Epoch 21).
- **Model Status:** Driven dynamically by `GET /health` (`model_loaded: true/false`). Displays `ONLINE` only when the model checkpoint is loaded and active, otherwise `OFFLINE`.
- **Disclaimer:** Decision-support research prototype. Not an official meteorological forecasting agency.

---

## 6. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Lucide Icons, Recharts, Leaflet 1.9, react-leaflet 5, react-globe.gl 2.
- **Backend API Gateway:** Node.js, Express 5, Axios, CORS.
- **ML & Ocean Service:** Python 3.10+, FastAPI, PyTorch 2.3.1, Uvicorn, Copernicus Marine Toolbox 2.5.0, Xarray, Pydantic.
- **Hosting:** Vercel (Frontend SPA Edge) + Render (Node API & Python FastAPI services).

---

## 7. Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PyTorch 2.3.1 (`pip install torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu`)

### Step 1: Python ML & Copernicus Service
```bash
cd backend/ml
pip install -r requirements.txt

# Set local model path and Copernicus credentials in terminal or .env
$env:MODEL_PATH = "C:\path\to\best_model.zip"
$env:COPERNICUSMARINE_SERVICE_USERNAME = "your_email@domain.com"
$env:COPERNICUSMARINE_SERVICE_PASSWORD = "your_password"

python api.py
# Runs on http://127.0.0.1:8001
```

### Step 2: Node.js Backend API Gateway
```bash
# In project root
npm run start:api
# Or: node backend/server.js
# Runs on http://localhost:8000
```

### Step 3: React Frontend (Vite)
```bash
# In project root
npm run dev
# Opens on http://localhost:5173
```

---

## 8. Cloud Deployment (Vercel + Render)

```
Vercel Edge Deployment (https://cyclone-x-delta.vercel.app)
               ↓ HTTPS
Public Node API Gateway (Render: https://cyclonex-api.onrender.com)
               ↓ Internal HTTP
Python FastAPI & PyTorch ML (Render: https://cyclonex-ml.onrender.com)
```

1. **Deploy Frontend on Vercel:**
   Set environment variable:
   `VITE_API_BASE_URL` = `https://your-backend-api.onrender.com`

2. **Deploy Backend on Render (`render.yaml`):**
   - Service 1: `cyclonex-api` (Node.js runtime, rootDir: `backend`)
     - `FRONTEND_ORIGIN` = `https://cyclone-x-delta.vercel.app`
     - `ML_SERVICE_URL` = `https://cyclonex-ml.onrender.com`
   - Service 2: `cyclonex-ml` (Python runtime, rootDir: `backend/ml`)
     - `MODEL_PATH` = `/app/best_model.zip`
     - `MODEL_DOWNLOAD_URL` = `<public direct URL to best_model.zip>`
     - `COPERNICUSMARINE_SERVICE_USERNAME` = `<secret>`
     - `COPERNICUSMARINE_SERVICE_PASSWORD` = `<secret>`

---

## 9. 2D Leaflet Map Invalidation & Resize Fix
The Leaflet map in `CycloneMap.tsx` implements `MapLifecycleController` using `map.invalidateSize()` triggered across staggered lifecycle delays (100ms, 300ms, 600ms) and dynamic `ResizeObserver` tracking on the map container. This guarantees seamless tile rendering without gray rectangles or clipping when toggling between 2D and 3D views or resizing the browser window.

---

## 10. Data Attribution & Transparency
- **Sea Surface Temperature:** E.U. Copernicus Marine Service (UK Met Office OSTIA L4 NRT).
- **Atmospheric Weather:** Open-Meteo Public Weather API (DWD/NOAA/ECMWF open data).
- **Historical Cyclone Tracks:** NOAA NCEI IBTrACS v04r01 (International Best Track Archive for Climate Stewardship).
- **Satellite Imagery:** NASA GIBS (Global Imagery Browse Services) / EOSDIS.
- **Base Map:** OpenStreetMap contributors (ODbL).

---

## 11. Disclaimer
CycloneX is a prototype developed for the Smart India Hackathon 2026 (SIH26070). Predictions, simulated What-If modifications, and risk estimates are intended for academic and decision-support research purposes and do not replace official cyclone bulletins issued by the India Meteorological Department (IMD) or national disaster management authorities.
