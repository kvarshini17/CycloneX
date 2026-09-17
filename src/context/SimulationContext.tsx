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

export type AppMode = 'REAL' | 'DEMO';

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

        const response = await fetch('/api/ai/predict', {
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
        aiStatus
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
