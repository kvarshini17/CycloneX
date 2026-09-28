import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  BASELINE_INPUTS,
  INTENSITY_RANGE,
  TRACK_SHIFT_RANGE,
  baselineSimulation,
  runSimulation,
  type SimulationInputs,
  type SimulationResult,
} from '../utils/simulation';
import type { CycloneObservation } from '../models/cycloneObservation';
import type { MLPipelineExecutionSummary } from '../models/mlPipelineTypes';
import { ingestionOrchestrator } from '../services/ingestion';

export type AppMode = 'REAL' | 'DEMO';

export interface ActiveCyclone {
  id: string;
  name: string;
  classification: string;
  latitude: number;
  longitude: number;
  windKmh: number | null;
  pressureHpa: number | null;
  movement: string;
  source: string;
  timestamp: string;
}

export interface RealLocationAnalysis {
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  cyclone_status: string;
  active_cyclones_count: number;
  matched_cyclone: ActiveCyclone | null;
  closest_cyclone_distance_km: number | null;
  environment: {
    sst_c: number | null;
    sst_status: string;
    sst_source: string;
    wind_kmh: number | null;
    pressure_hpa: number | null;
    temperature_c: number | null;
    humidity_pct: number | null;
    precipitation_mm: number | null;
    weather_status: string;
  };
  exposure: {
    population: string;
    hospitals: string;
    communication_towers: string;
    note: string;
  };
  model: {
    status: 'ONLINE' | 'OFFLINE';
    inference_time_ms?: number;
    task: string;
    satellite_input: string;
    prediction?: {
      predicted_wind_kmh: number;
      predicted_pressure_hpa: number;
      delta_lat: number;
      delta_lon: number;
      projected_lat: number;
      projected_lon: number;
      category_index: number;
    };
  };
  impacts: Array<{
    category: string;
    severity: string;
    description: string;
  }>;
  preparedness: string[];
  disclaimer: string;
}

interface SimulationContextValue {
  inputs: SimulationInputs;
  result: SimulationResult;
  baseline: SimulationResult;
  isModified: boolean;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  setIntensity: (value: number) => void;
  setTrackShift: (value: number) => void;
  reset: () => void;
  
  liveObservation: CycloneObservation | null;
  setLiveObservation: (obs: CycloneObservation | null) => void;
  liveEvaluation: MLPipelineExecutionSummary | null;
  setLiveEvaluation: (evalSummary: MLPipelineExecutionSummary | null) => void;
  
  // Real Local AI Data
  aiData: any;
  aiStatus: 'ONLINE' | 'OFFLINE' | 'LOADING';

  // REAL DATA Mode Additions (Phases 2, 5, 6, 15)
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation: (loc: { lat: number; lng: number } | null) => void;
  selectedCyclone: ActiveCyclone | null;
  setSelectedCyclone: (cyclone: ActiveCyclone | null) => void;
  realAnalysis: RealLocationAnalysis | null;
  isAnalyzing: boolean;
  activeCyclones: ActiveCyclone[];
  analyzeLocation: (lat: number, lng: number) => Promise<void>;
  refreshActiveCyclones: () => Promise<void>;
  
  // What-If Scenario Shift Integration
  realScenarioResult: any | null;
  isScenarioRunning: boolean;
  runScenarioAnalysis: (shiftKm: number, deltaInt: number) => Promise<void>;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<SimulationInputs>(BASELINE_INPUTS);
  const [appMode, setAppMode] = useState<AppMode>('DEMO');
  
  const [liveObservation, setLiveObservation] = useState<CycloneObservation | null>(null);
  const [liveEvaluation, setLiveEvaluation] = useState<MLPipelineExecutionSummary | null>(null);

  const result = useMemo(() => runSimulation(inputs, liveObservation, liveEvaluation), [inputs, liveObservation, liveEvaluation]);
  const isModified = inputs.intensityDeltaPercent !== 0 || inputs.trackShiftKm !== 0;

  // Real SIH26070 Local Inference
  const [aiData, setAiData] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<'ONLINE' | 'OFFLINE' | 'LOADING'>('LOADING');
  // Ingest multi-source observation (Copernicus SST, Open-Meteo weather, etc.) for DEMO mode
  useEffect(() => {
    let isCancelled = false;
    async function loadMultiSourceData() {
      if (appMode !== 'DEMO') return;
      try {
        const currentLat = result.trackPoints.find(p => p.kind === 'current')?.lat || 16.9;
        const currentLon = result.trackPoints.find(p => p.kind === 'current')?.lng || 83.6;
        const obs = await ingestionOrchestrator.ingestCurrentObservation(currentLat, currentLon, appMode);
        if (!isCancelled) {
          setLiveObservation(obs);
        }
      } catch (err) {
        console.warn('[SimulationContext] Multi-source ingestion error:', err);
      }
    }
    loadMultiSourceData();
    return () => {
      isCancelled = true;
    };
  }, [appMode]);

  // REAL DATA Mode State & Ingestion (Phases 2, 5, 6, 15)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCyclone, setSelectedCyclone] = useState<ActiveCyclone | null>(null);
  const [realAnalysis, setRealAnalysis] = useState<RealLocationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCyclones, setActiveCyclones] = useState<ActiveCyclone[]>([]);
  const [realScenarioResult, setRealScenarioResult] = useState<any | null>(null);
  const [isScenarioRunning, setIsScenarioRunning] = useState(false);

  const refreshActiveCyclones = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/real/cyclones`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.cyclones)) {
          setActiveCyclones(data.cyclones);
          if (data.cyclones.length > 0 && !selectedCyclone) {
            setSelectedCyclone(data.cyclones[0]);
          }
        }
      }
    } catch (err) {
      console.warn('[SimulationContext] Failed to fetch active cyclones:', err);
    }
  };

  const analyzeLocation = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsAnalyzing(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/real/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      if (res.ok) {
        const data: RealLocationAnalysis = await res.json();
        setRealAnalysis(data);
        if (data.matched_cyclone) {
          setSelectedCyclone(data.matched_cyclone);
        }
        if (data.model && data.model.status === 'ONLINE' && data.model.prediction) {
          setAiData({
            wind: data.model.prediction.predicted_wind_kmh,
            pressure: data.model.prediction.predicted_pressure_hpa,
            delta_lat: data.model.prediction.delta_lat,
            delta_lon: data.model.prediction.delta_lon,
            projectedLat: data.model.prediction.projected_lat,
            projectedLng: data.model.prediction.projected_lon,
            category: data.model.prediction.category_index
          });
          setAiStatus('ONLINE');
        }
      }
    } catch (err) {
      console.warn('[SimulationContext] Real analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runScenarioAnalysis = async (shiftKm: number, deltaInt: number) => {
    setIsScenarioRunning(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      
      // Determine baseline track: if in REAL mode and cyclone selected, use its location + prediction
      let baseTrack: any[] = [];
      let stormName = 'Cyclone Varun (Demo)';

      if (appMode === 'REAL' && selectedCyclone) {
        stormName = selectedCyclone.name;
        baseTrack = [
          { lat: selectedCyclone.latitude - 0.5, lon: selectedCyclone.longitude - 0.5, kind: 'past', windKmh: (selectedCyclone.windKmh || 70) - 10, pressureHpa: (selectedCyclone.pressureHpa || 995) + 5 },
          { lat: selectedCyclone.latitude, lon: selectedCyclone.longitude, kind: 'observed', windKmh: selectedCyclone.windKmh || 75, pressureHpa: selectedCyclone.pressureHpa || 990 },
          { lat: selectedCyclone.latitude + 0.8, lon: selectedCyclone.longitude + 0.6, kind: 'future', windKmh: (selectedCyclone.windKmh || 75) + 10, pressureHpa: (selectedCyclone.pressureHpa || 990) - 5 },
          { lat: selectedCyclone.latitude + 1.8, lon: selectedCyclone.longitude + 1.2, kind: 'future', windKmh: (selectedCyclone.windKmh || 75) + 20, pressureHpa: (selectedCyclone.pressureHpa || 990) - 12 }
        ];
      } else {
        baseTrack = result.trackPoints.map(p => ({
          lat: p.lat,
          lon: p.lng,
          kind: p.kind === 'forecast' ? 'future' : (p.kind === 'current' ? 'observed' : 'past'),
          windKmh: p.windKmh,
          pressureHpa: 980
        }));
      }

      const res = await fetch(`${apiBase}/api/real/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baselineTrack: baseTrack,
          trackShiftKm: shiftKm,
          intensityDeltaPercent: deltaInt,
          cycloneName: stormName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRealScenarioResult(data);
      }
    } catch (err) {
      console.warn('[SimulationContext] Scenario computation failed:', err);
    } finally {
      setIsScenarioRunning(false);
    }
  };

  // Hard Mode Isolation: On REAL mode switch, fetch active cyclones & default coordinate
  useEffect(() => {
    if (appMode === 'REAL') {
      refreshActiveCyclones();
      const initLat = selectedLocation ? selectedLocation.lat : 15.2;
      const initLng = selectedLocation ? selectedLocation.lng : 82.4;
      analyzeLocation(initLat, initLng);
    } else {
      // Clear real mode state on return to DEMO to prevent state leakage
      setRealAnalysis(null);
      setSelectedLocation(null);
      setSelectedCyclone(null);
      setRealScenarioResult(null);
    }
  }, [appMode]);

  useEffect(() => {
    async function fetchAiPrediction() {
      setAiStatus('LOADING');
      try {
        const currentWind = result.windKmh;
        const currentPres = result.pressureHpa;
        const currentLat = result.trackPoints.find(p => p.kind === 'current')?.lat || 16.9;
        const currentLon = result.trackPoints.find(p => p.kind === 'current')?.lng || 83.6;
        
        const trackSequence = Array.from({ length: 9 }).map((_, i) => {
          return [
            currentLat - 1.6 + i * 0.2,            
            currentLon + 0.8 - i * 0.1,            
            currentWind - (8 - i) * 5, 
            currentPres + (8 - i) * 3, 
            i * 6                      
          ];
        });

        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(apiBase + '/api/ai/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ track_sequence: trackSequence })
        });
        
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        if (data.success) {
          // Append calculated future position relative to current base
          data.predictions.projectedLat = currentLat + data.predictions.delta_lat;
          data.predictions.projectedLng = currentLon + data.predictions.delta_lon;
          setAiData(data.predictions);
          setAiStatus('ONLINE');
        } else {
          setAiStatus('OFFLINE');
        }
      } catch (err) {
        setAiStatus('OFFLINE');
      }
    }
    const timer = setTimeout(fetchAiPrediction, 500);
    return () => clearTimeout(timer);
  }, [result.windKmh, result.pressureHpa, appMode]);

  const setIntensity = (value: number) =>
    setInputs((prev) => ({
      ...prev,
      intensityDeltaPercent: Math.max(INTENSITY_RANGE[0], Math.min(INTENSITY_RANGE[1], value)),
    }));

  const setTrackShift = (value: number) =>
    setInputs((prev) => ({
      ...prev,
      trackShiftKm: Math.max(TRACK_SHIFT_RANGE[0], Math.min(TRACK_SHIFT_RANGE[1], value)),
    }));

  const reset = () => setInputs(BASELINE_INPUTS);

  return (
    <SimulationContext.Provider
      value={{ 
        inputs, 
        result, 
        baseline: baselineSimulation, 
        isModified, 
        appMode, 
        setAppMode, 
        setIntensity, 
        setTrackShift, 
        reset,
        liveObservation,
        setLiveObservation,
        liveEvaluation,
        setLiveEvaluation,
        aiData,
        aiStatus,
        selectedLocation,
        setSelectedLocation,
        selectedCyclone,
        setSelectedCyclone,
        realAnalysis,
        isAnalyzing,
        activeCyclones,
        analyzeLocation,
        refreshActiveCyclones,
        realScenarioResult,
        isScenarioRunning,
        runScenarioAnalysis
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}

