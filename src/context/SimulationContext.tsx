import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
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
  
  // Real Data Pipeline Connections
  liveObservation: CycloneObservation | null;
  setLiveObservation: (obs: CycloneObservation | null) => void;
  liveEvaluation: MLPipelineExecutionSummary | null;
  setLiveEvaluation: (evalSummary: MLPipelineExecutionSummary | null) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<SimulationInputs>(BASELINE_INPUTS);
  const [appMode, setAppMode] = useState<AppMode>('DEMO');
  
  const [liveObservation, setLiveObservation] = useState<CycloneObservation | null>(null);
  const [liveEvaluation, setLiveEvaluation] = useState<MLPipelineExecutionSummary | null>(null);

  const result = useMemo(() => runSimulation(inputs, liveObservation, liveEvaluation), [inputs, liveObservation, liveEvaluation]);
  const isModified = inputs.intensityDeltaPercent !== 0 || inputs.trackShiftKm !== 0;

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
        setLiveEvaluation
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
