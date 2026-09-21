# CycloneX

**AI-Powered Cyclone Intelligence & Emergency Decision-Support System**

---

## SIH Problem Statement

**SIH26070** — AI/ML-based identification, classification and prediction of tropical cyclone patterns using multi-source satellite data.

Competition: Smart India Hackathon 2026

---

## Overview

CycloneX is a prototype cyclone intelligence and emergency decision-support system that demonstrates an end-to-end pipeline from multi-source data ingestion through AI/ML prediction to geospatial risk visualization and emergency response planning.

The system integrates:

- Satellite-derived cloud and thermal imagery (INSAT-3DR / MOSDAC — optional)
- Historical cyclone track data (IBTrACS format)
- Atmospheric and weather parameters (temperature, wind shear, vorticity, humidity)
- Ocean/SST data (Sea Surface Temperature)
- GIS/DEM data (elevation, coastal geography)
- AI/ML-based intensity and track prediction
- Geospatial risk visualization
- Emergency decision support with scenario simulation

> **Disclaimer:** All cyclone scenarios and operational values shown in the demonstration are for prototype/demo purposes unless explicitly identified as real observed data. CycloneX is a research prototype and is not an operational cyclone warning system.

---

## Core Pipeline

`
Multi-Source Data
        ↓
Preprocessing & Feature Extraction
        ↓
AI/ML Model (CyclonePredictorNet — SIH26070)
        ↓
Cyclone Intelligence & Classification
        ↓
Risk Assessment & Zone Mapping
        ↓
Geospatial Visualization (2D Map + 3D Globe)
        ↓
Emergency Decision Support
`

---

## AI/ML Architecture (SIH26070 — CyclonePredictorNet)

The core AI model is a multi-modal neural network that fuses satellite image features with historical track sequences.

### Inputs

| Input | Shape | Description |
|-------|-------|-------------|
| Satellite Image | (B, 4, 201, 201) | 4-channel multi-spectral patch centred on the cyclone |
| Historical Track | (B, 9, 5) | 9 timesteps × 5 features: [lat, lon, wind, pressure, elapsed_hours] |

### Architecture

`
Satellite Image (4-channel, 201×201)
        ↓
ImageEncoder
  ├── Stem Conv (7×7, stride 2) → 32ch
  ├── ConvBlock: 32→64 (stride 2)  + Channel Attention
  ├── ConvBlock: 64→128 (stride 2) + Channel Attention
  ├── ConvBlock: 128→256 (stride 2)+ Channel Attention
  ├── ConvBlock: 256→256           + Channel Attention
  └── Global Average Pool → 256-dim image embedding

Historical Track (9 steps × 5 features)
        ↓
TrackEncoder
  ├── Bidirectional LSTM (64 hidden, 2 layers, dropout 0.1)
  └── Linear projection → 128-dim track embedding

Feature Fusion
  └── Concat [256 + 128] → 384-dim fused vector

Shared MLP
  ├── Linear(384 → 256) + LayerNorm + GELU + Dropout(0.2)
  └── Linear(256 → 128) + LayerNorm + GELU

Prediction Heads
  ├── Wind Speed Head:    Linear(128 → 1)  → wind speed (km/h)
  ├── Pressure Head:      Linear(128 → 1)  → central pressure (hPa)
  ├── Track Head:         Linear(128 → 2)  → ΔLat, ΔLon (one-step movement)
  └── Category Head:      Linear(128 → 7)  → 7-class cyclone intensity category
`

### Category Classification (IMD Scale)

| Class | Category |
|-------|----------|
| 0 | Depression |
| 1 | Deep Depression |
| 2 | Cyclonic Storm |
| 3 | Severe Cyclonic Storm |
| 4 | Very Severe Cyclonic Storm |
| 5 | Extremely Severe Cyclonic Storm |
| 6 | Super Cyclonic Storm |

### Implementation Notes

- Trained on multi-source cyclone data using PyTorch
- Channel Attention gates applied to each convolutional block
- Bidirectional LSTM captures both forward and backward temporal dependencies in the track sequence
- Checkpoint: est_model.zip (loaded via MODEL_PATH environment variable)
- Inference device: CPU (CUDA supported if available)

---

## Technology Stack

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| 2D Map | Leaflet 1.9 + react-leaflet 5 |
| 3D Globe | react-globe.gl 2 |
| Icons | lucide-react |
| Styling | Tailwind CSS 4 |

### Backend
| Component | Technology |
|-----------|-----------|
| API Gateway | Node.js + Express 5 |
| HTTP Client | Axios |
| Port | 8000 |

### AI/ML Service
| Component | Technology |
|-----------|-----------|
| Framework | PyTorch 2.3.1 |
| API Server | FastAPI + Uvicorn |
| Data Validation | Pydantic 2 |
| Port | 8001 |

### Data Sources
| Source | Usage |
|--------|-------|
| INSAT-3DR / MOSDAC | Satellite IR imagery (optional — requires credentials) |
| NASA GIBS / MODIS | Historical satellite demo visualization |
| IBTrACS | Historical cyclone track dataset |
| Open-Meteo | Live weather data (no API key required) |

---

## Dashboard Features

| Feature | Description |
|---------|-------------|
| **Command Dashboard** | Central overview — status cards, AI outputs, alerts |
| **Multi-Source Intelligence** | Satellite, weather, ocean, GIS data integration panels |
| **Cyclone Analysis** | Track history, intensity trends, atmospheric parameters |
| **AI Prediction** | SIH26070 model outputs — wind, pressure, movement, category |
| **Risk Assessment** | Geospatial risk zone mapping with population exposure |
| **What-If Simulator** | Interactive intensity and track deviation scenario planning |
| **Emergency Intelligence** | Priority alerts, resource requirements, response timelines |
| **AI Disaster Commander** | Decision-support overlay for emergency operations |
| **2D Map** | Leaflet/OpenStreetMap with cyclone track, risk zones, replay |
| **3D Globe** | react-globe.gl with cyclone path and geographic context |
| **Satellite Visualization** | Historical/demo IR satellite layer with Dvorak color ramp |
| **Demo Replay** | Step through historical cyclone track with synchronized satellite frames |

---

## Satellite Data

The current demonstration uses **historical and simulated satellite visualization**:

- **Historical frames**: NASA GIBS (Terra/Aqua MODIS) imagery for Cyclone Michaung (December 2023)
- **Synthetic IR overlay**: Canvas-rendered brightness temperature pattern (Dvorak IR color ramp: blue=cold deep convection → red=warm/clear)

**MOSDAC/INSAT-3DR integration** is implemented in the backend (ackend/server.js) but requires valid MOSDAC credentials. Without credentials, the application operates fully in DEMO mode.

> The current demonstration uses simulated/historical data and is **not** an operational cyclone warning system.

---

## Running Locally

### Prerequisites

- Node.js 18+
- Python 3.10+
- PyTorch 2.3.1 (pip install torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu)

### 1 — Frontend

`ash
npm install
npm run dev
# Opens at http://localhost:5173
`

### 2 — Backend API Gateway

`ash
node backend/server.js
# Runs at http://localhost:8000
`

Or using the npm script:

`ash
npm run start:api
`

### 3 — Python ML Service

`ash
cd backend/ml
pip install -r requirements.txt

# Set path to the trained model checkpoint
export MODEL_PATH=/path/to/best_model.zip    # Linux/macOS
set MODEL_PATH=C:\path\to\best_model.zip     # Windows

python api.py
# Runs at http://127.0.0.1:8001
`

> The Python ML service requires the trained est_model.zip checkpoint. Without it, the AI prediction cards show OFFLINE status. The rest of the application works normally.

### Start Order

Start services in this order:
1. Python ML service (port 8001)
2. Node backend (port 8000)
3. Frontend dev server (port 5173)

---

## Environment Variables

Create a .env file in the project root (never commit this file):

`env
# Path to trained SIH26070 model checkpoint
MODEL_PATH=C:/path/to/best_model.zip

# MOSDAC credentials (optional — for real INSAT-3DR satellite data)
# Register at https://mosdac.gov.in
MOSDAC_USERNAME=
MOSDAC_PASSWORD=
MOSDAC_BASE_URL=https://mosdac.gov.in
MOSDAC_DATASET_ID=3RIMG_L1B_STD

# Backend configuration
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
`

See .env.example for a template.

---

## Project Structure

`
CycloneX/
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── CycloneMap.tsx        # 2D Leaflet map with tracks, risk zones, replay
│   │   ├── GlobeMap.tsx          # 3D react-globe.gl visualization
│   │   ├── PredictionPanel.tsx   # AI prediction panel (observed vs SIH26070)
│   │   ├── StatusCards.tsx       # Dashboard status cards + AI output cards
│   │   ├── RiskAssessment.tsx    # Risk zone table and exposure analysis
│   │   ├── WhatIfSimulator.tsx   # Interactive scenario simulator
│   │   └── ...                   # Other dashboard components
│   ├── context/
│   │   └── SimulationContext.tsx # Shared state — simulation, AI data, app mode
│   ├── data/
│   │   └── demoData.ts           # Demo scenario: Cyclone Varun (fictional)
│   ├── services/
│   │   └── ingestion/            # Data ingestion services (satellite, weather)
│   ├── utils/
│   │   └── simulation.ts         # What-If simulation engine
│   └── types/                    # TypeScript type definitions
│
├── backend/
│   ├── server.js                 # Node.js/Express API gateway (port 8000)
│   └── ml/
│       ├── api.py                # FastAPI ML inference service (port 8001)
│       ├── predictor.py          # CyclonePredictorNet architecture (SIH26070)
│       └── requirements.txt      # Python dependencies
│
├── .env.example                  # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
`

---

## Demo Scenario

The default demonstration uses **Cyclone Varun** — a fictional cyclone scenario in the Bay of Bengal used solely for illustrating the CycloneX interface and pipeline. Historical replay frames are derived from Cyclone Michaung (December 2023) data via NASA GIBS.

> All cyclone scenarios and operational values shown in the demonstration are for prototype/demo purposes unless explicitly identified as real observed data.

---

## AI Model Disclaimer

The SIH26070 AI model (CyclonePredictorNet) is a **prototype decision-support model** developed for the Smart India Hackathon 2026. It should not be treated as an official meteorological warning system. Predictions are for research and demonstration only.

---

## Security Notes

The following files are excluded from version control (.gitignore):

- .env — credentials and secrets
- est_model.zip, *.pt, *.pth — model checkpoints (large/private)
- mdapi.zip, mdapi.py — MOSDAC API reference (not for redistribution)
- ackend/data/ — downloaded satellite cache

---

## License

Developed for Smart India Hackathon 2026 — SIH26070.
