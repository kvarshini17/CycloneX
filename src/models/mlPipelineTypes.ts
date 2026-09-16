// =============================================================================
// CycloneX — AI / ML Model Interface Contracts (SIH26070)
// =============================================================================
// Formally specifies the input/output signatures and pipeline specifications
// for the 4 core models required by the SIH26070 problem statement:
//
// Model 1: Cyclone Detection (tropical disturbance vs depression vs storm)
// Model 2: Cyclone Classification (IMD classification & intensity stage)
// Model 3: Track Prediction (forecasted coordinates & trajectory cone)
// Model 4: Intensity Prediction (projected wind, central pressure & rapid intensification)
// =============================================================================

import type { FusedCycloneFeatureVector } from './cycloneObservation';

export type CycloneStageIMD =
  | 'Low Pressure Area (LPA)'
  | 'Depression (D)'
  | 'Deep Depression (DD)'
  | 'Cyclonic Storm (CS)'
  | 'Severe Cyclonic Storm (SCS)'
  | 'Very Severe Cyclonic Storm (VSCS)'
  | 'Extremely Severe Cyclonic Storm (ESCS)'
  | 'Super Cyclonic Storm (SuCS)';

// -----------------------------------------------------------------------------
// MODEL 1: CYCLONE DETECTION
// -----------------------------------------------------------------------------
export interface DetectionModelInput {
  satelliteNormalizedTensor: number[][]; // 224x224 normalized matrix or RoI thumbnail
  spectralBandsIncluded: ('VIS' | 'IR' | 'WV')[];
  environmentalShearKnots: number;
  lowLevelVorticity: number;
}

export interface DetectionModelOutput {
  isCycloneDetected: boolean;
  systemClass: 'NO_CIRCULATION' | 'TROPICAL_DISTURBANCE' | 'DEPRESSION_OR_ABOVE';
  detectionConfidencePercent: number;
  estimatedCenterLat: number;
  estimatedCenterLng: number;
  centerConfidenceRadiusKm: number;
  cdoDetected: boolean;
  inferenceTimeMs: number;
  modelArchitecture: string; // e.g. "ResNet50-V2 + Spatio-Temporal Attention"
}

// -----------------------------------------------------------------------------
// MODEL 2: CYCLONE CLASSIFICATION
// -----------------------------------------------------------------------------
export interface ClassificationModelInput {
  fusedVector: FusedCycloneFeatureVector;
  minCloudTopTempCelsius: number;
  dvorakTNumberPrior?: number;
}

export interface ClassificationModelOutput {
  stage: CycloneStageIMD;
  dvorakRating: string; // e.g. "T4.5 / CI 4.5"
  maxWindKmh: number;
  centralPressureHpa: number;
  stageConfidencePercent: number;
  classProbabilities: Record<string, number>; // class -> probability
  modelArchitecture: string; // e.g. "Multi-Modal Vision Transformer + Tabular MLP Fusion"
}

// -----------------------------------------------------------------------------
// MODEL 3: TRACK PREDICTION
// -----------------------------------------------------------------------------
export interface TrackForecastPoint {
  forecastHour: number; // e.g. +6, +12, +18, +24, +48
  timestamp: string;
  predictedLat: number;
  predictedLng: number;
  coneRadiusKm: number; // uncertainty cone 70% confidence interval
  predictedSpeedKmh: number;
  headingDegrees: number;
}

export interface TrackPredictionModelInput {
  fusedVector: FusedCycloneFeatureVector;
  pastTrackPoints: { lat: number; lng: number; hourOffset: number }[];
  steeringFlowVector: { uVector: number; vVector: number }; // 500 hPa synoptic steering
}

export interface TrackPredictionModelOutput {
  forecastHorizonHours: number; // 24 or 48
  projectedTrajectory: TrackForecastPoint[];
  estimatedLandfallPoint?: {
    lat: number;
    lng: number;
    locationName: string;
    etaHours: number;
    crossTrackErrorKm: number;
  };
  modelArchitecture: string; // e.g. "Bidirectional LSTM / Physics-Informed Neural Network (PINN)"
}

// -----------------------------------------------------------------------------
// MODEL 4: INTENSITY PREDICTION
// -----------------------------------------------------------------------------
export interface IntensityForecastPoint {
  forecastHour: number;
  projectedWindKmh: number;
  projectedPressureHpa: number;
  category: CycloneStageIMD;
}

export interface IntensityPredictionModelInput {
  fusedVector: FusedCycloneFeatureVector;
  sstUnderTrack: number;
  oceanHeatContent: number;
  verticalWindShear: number;
}

export interface IntensityPredictionModelOutput {
  rapidIntensificationProbabilityPercent: number; // probability of >= 30 kt wind increase in 24h
  riThresholdMet: boolean;
  projectedPeakWindKmh: number;
  projectedMinPressureHpa: number;
  forecastPoints: IntensityForecastPoint[];
  primaryIntensificationDriver: 'HIGH_SST' | 'LOW_SHEAR' | 'UPPER_DIVERGENCE' | 'LAND_INTERACTION' | 'DRY_AIR_INTRUSION';
  modelArchitecture: string; // e.g. "XGBoost + Gradient Boosted Quantile Regressor"
}

// -----------------------------------------------------------------------------
// UNIFIED ML PIPELINE SUMMARY
// -----------------------------------------------------------------------------
export interface MLPipelineExecutionSummary {
  pipelineStatus: 'PROTOTYPE_SIMULATION' | 'OFFLINE_TRAINED' | 'ONLINE_INFERENCE';
  detection: DetectionModelOutput;
  classification: ClassificationModelOutput;
  track: TrackPredictionModelOutput;
  intensity: IntensityPredictionModelOutput;
  overallConfidenceScorePercent: number;
  fusedFeatureCount: number;
  executionTimestamp: string;
  disclaimer: string;
}
