// =============================================================================
// CycloneX — What-If Simulation Engine
// =============================================================================
// Pure, deterministic functions that turn a small set of scenario inputs
// (intensity change, track shift) into every downstream number the UI shows:
// risk score, affected population, high-risk zone count, hospital risk,
// communication risk, map risk-zone sizing, the predicted track, and the
// AI Disaster Commander's recommendations.
//
// There is no randomness anywhere in this file. The same inputs always
// produce the same outputs, and the formulas are simple and readable on
// purpose — this is a transparent decision-support demo, not a physical
// weather model.
// =============================================================================

import {
  baselineRiskScore,
  commZones as baseCommZones,
  cycloneProfile,
  hospitals as baseHospitals,
  riskAssessment as baseRiskAssessment,
  riskZones as baseRiskZones,
  trackPoints as baseTrackPoints,
} from '../data/demoData';
import type { CycloneObservation } from '../models/cycloneObservation';
import type { MLPipelineExecutionSummary } from '../models/mlPipelineTypes';
import type { CommZone, Hospital, RiskLevel, RiskZone, TrackPoint } from '../types';

export interface SimulationInputs {
  /** Percentage change in cyclone intensity, from -20% to +20%. */
  intensityDeltaPercent: number;
  /** Track shift in km. Negative = toward the coast, positive = away from it. */
  trackShiftKm: number;
}

export type EmergencyPriority = 'STANDARD' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface RecommendationItem {
  priority: number;
  title: string;
  detail: string;
  category: 'Evacuation' | 'Medical' | 'Communication' | 'Shelter' | 'Logistics';
}

export interface SimulatedRiskZone extends RiskZone {
  /** How much larger/smaller than the baseline radius this zone is drawn, e.g. 1.3 = +30%. */
  radiusMultiplier: number;
}

export interface SimulationResult {
  inputs: SimulationInputs;
  windKmh: number;
  pressureHpa: number;
  stage: string;
  riskScore: number;
  /** riskScore minus the baseline (intensity=0, shift=0) riskScore. */
  scoreDelta: number;
  affectedPopulationM: number;
  highRiskZones: number;
  overallRisk: RiskLevel;
  floodRisk: RiskLevel;
  windRisk: RiskLevel;
  stormSurgeRisk: RiskLevel;
  infrastructureRisk: RiskLevel;
  emergencyPriority: EmergencyPriority;
  hospitals: Hospital[];
  commZones: CommZone[];
  riskZones: SimulatedRiskZone[];
  trackPoints: TrackPoint[];
  recommendations: RecommendationItem[];
}

export const BASELINE_INPUTS: SimulationInputs = { intensityDeltaPercent: 0, trackShiftKm: 0 };
export const INTENSITY_RANGE: [number, number] = [-20, 20];
export const TRACK_SHIFT_RANGE: [number, number] = [-80, 80];

// -----------------------------------------------------------------------------
// IMD-style wind-speed classification, used so the "Classification" shown in
// the UI actually tracks the simulated wind speed instead of being frozen text.
// -----------------------------------------------------------------------------
export function classifyStage(windKmh: number): string {
  if (windKmh < 50) return 'Depression';
  if (windKmh < 62) return 'Deep Depression';
  if (windKmh < 89) return 'Cyclonic Storm';
  if (windKmh < 118) return 'Severe Cyclonic Storm';
  if (windKmh < 166) return 'Very Severe Cyclonic Storm';
  if (windKmh < 222) return 'Extremely Severe Cyclonic Storm';
  return 'Super Cyclonic Storm';
}

function deriveRiskFromWind(windKmh: number): RiskLevel {
  if (windKmh >= 118) return 'HIGH';
  if (windKmh >= 89) return 'MEDIUM';
  return 'LOW';
}

const RISK_ORDER: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

/** Escalates or de-escalates a risk level by a whole number of steps, clamped to LOW..HIGH. */
function stepRisk(level: RiskLevel, steps: number): RiskLevel {
  const idx = RISK_ORDER.indexOf(level);
  const next = Math.min(RISK_ORDER.length - 1, Math.max(0, idx + steps));
  return RISK_ORDER[next];
}

/** Converts a risk-score delta into a whole number of escalation/de-escalation steps. */
function stepsFromScoreDelta(delta: number): number {
  if (delta >= 22) return 2;
  if (delta >= 10) return 1;
  if (delta <= -22) return -2;
  if (delta <= -10) return -1;
  return 0;
}

function priorityFromRisk(risk: RiskLevel): Hospital['priority'] {
  if (risk === 'HIGH') return 'High Priority';
  if (risk === 'MEDIUM') return 'Prepare';
  return 'Monitor';
}

/**
 * Core deterministic scenario model. Every output is a plain formula over
 * the two inputs — no randomness, no external calls.
 */
export function runSimulation(inputs: SimulationInputs, liveObservation?: CycloneObservation | null, liveEvaluation?: MLPipelineExecutionSummary | null): SimulationResult {
  const intensity = Math.max(INTENSITY_RANGE[0], Math.min(INTENSITY_RANGE[1], inputs.intensityDeltaPercent));
  const trackShiftKm = Math.max(TRACK_SHIFT_RANGE[0], Math.min(TRACK_SHIFT_RANGE[1], inputs.trackShiftKm));
  const normalizedInputs: SimulationInputs = { intensityDeltaPercent: intensity, trackShiftKm };

  // --- Wind / pressure / classification ---
  const baseWind = liveEvaluation?.classification.maxWindKmh ?? liveObservation?.maxSustainedWindKmh ?? cycloneProfile.windKmh;
  const windKmh = Math.max(40, Math.round(baseWind * (1 + intensity / 100)));
  const basePressure = liveEvaluation?.classification.centralPressureHpa ?? liveObservation?.centralPressureHpa ?? cycloneProfile.pressureHpa;
  const pressureHpa = Math.max(900, Math.round(basePressure - intensity * 0.6));
  const stage = classifyStage(windKmh);

  // --- Risk score: intensity dominates; shifting the track toward the coast
  // (negative km) raises risk, shifting it away lowers risk. ---
  let riskScore = (liveEvaluation ? Math.min(99, baselineRiskScore + ((liveEvaluation.classification.maxWindKmh - cycloneProfile.windKmh) * 0.3)) : baselineRiskScore) + intensity * 0.7 - trackShiftKm * 0.18;
  riskScore = Math.max(10, Math.min(99, Math.round(riskScore)));
  const scoreDelta = riskScore - baselineRiskScore;
  const steps = stepsFromScoreDelta(scoreDelta);

  // --- Headline numbers ---
  let affectedPopulationM = 2.4 * (1 + intensity / 100) * (1 - trackShiftKm / 300);
  affectedPopulationM = Math.max(0.3, Math.round(affectedPopulationM * 10) / 10);

  let highRiskZones = Math.round(baseRiskAssessment.highRiskZones + intensity / 5 - trackShiftKm / 40);
  highRiskZones = Math.max(2, Math.min(18, highRiskZones));

  const emergencyPriority: EmergencyPriority =
    riskScore >= 90 ? 'CRITICAL' : riskScore >= 78 ? 'HIGH' : riskScore >= 60 ? 'ELEVATED' : 'STANDARD';

  // --- Category risk levels: baseline levels escalate/de-escalate together
  // with the overall score change, so the story stays internally consistent. ---
  const floodRisk = stepRisk(baseRiskAssessment.flood, steps);
  const windRisk = stepRisk(baseRiskAssessment.wind, steps);
  const stormSurgeRisk = stepRisk(baseRiskAssessment.stormSurge, steps);
  const infrastructureRisk = stepRisk(baseRiskAssessment.infrastructure, steps);
  const overallRisk = stepRisk(baseRiskAssessment.overall, steps);

  // --- Hospitals: risk (and therefore priority) shifts with the same steps. ---
  const hospitals: Hospital[] = baseHospitals.map((h) => {
    const risk = stepRisk(h.risk, steps);
    return { ...h, risk, priority: priorityFromRisk(risk) };
  });

  // --- Communication zones: risk shifts with steps; affected-tower estimate
  // scales with the risk-score delta. ---
  const commZones: CommZone[] = baseCommZones.map((z) => ({
    ...z,
    risk: stepRisk(z.risk, steps),
    towersAffected: Math.max(0, Math.round(z.towersAffected * (1 + scoreDelta / 100))),
  }));

  // --- Map risk zones: radius scales directly with intensity; level shifts
  // with the same steps as everything else. ---
  const radiusMultiplier = Math.max(0.5, Math.min(2, 1 + intensity / 40));
  const riskZones: SimulatedRiskZone[] = baseRiskZones.map((z) => ({
    ...z,
    level: stepRisk(z.level, steps),
    radiusMultiplier,
  }));

  // --- Predicted track: only forecast points move. History and the current
  // fix are observed, not hypothetical, so they never change. Forecast
  // longitude shifts toward/away from the coast; forecast wind scales with
  // intensity. ~100km per degree of longitude at this latitude (demo approx). ---
  const lngOffsetDeg = trackShiftKm / 100;
  const trackPoints: TrackPoint[] = baseTrackPoints.map((p) => {
    if (p.kind !== 'forecast') return p;
    const forecastWind = Math.max(40, Math.round(p.windKmh * (1 + intensity / 100)));
    return { ...p, lng: p.lng + lngOffsetDeg, windKmh: forecastWind };
  });

  const recommendations = buildRecommendations(emergencyPriority);

  return {
    inputs: normalizedInputs,
    windKmh,
    pressureHpa,
    stage,
    riskScore,
    scoreDelta,
    affectedPopulationM,
    highRiskZones,
    overallRisk,
    floodRisk,
    windRisk,
    stormSurgeRisk,
    infrastructureRisk,
    emergencyPriority,
    hospitals,
    commZones,
    riskZones,
    trackPoints,
    recommendations,
  };
}

// -----------------------------------------------------------------------------
// AI Disaster Commander recommendation sets, one per emergency-priority tier.
// Predefined demo logic — not a live LLM. The baseline scenario (no sliders
// touched) lands on the "HIGH" tier below.
// -----------------------------------------------------------------------------
function buildRecommendations(tier: EmergencyPriority): RecommendationItem[] {
  const sets: Record<EmergencyPriority, RecommendationItem[]> = {
    STANDARD: [
      { priority: 1, title: 'Maintain readiness at coastal shelters', detail: 'No mandatory evacuation triggered at current modeled intensity — keep shelters stocked and staffed.', category: 'Evacuation' },
      { priority: 2, title: 'Continue routine hospital monitoring', detail: 'Coastal hospitals remain at standard operating capacity; no surge preparation required yet.', category: 'Medical' },
      { priority: 3, title: 'Run baseline communication checks', detail: 'Confirm standard tower and backup-power status across coastal zones.', category: 'Communication' },
      { priority: 4, title: 'Keep shelters on standby', detail: 'No activation needed — verify capacity lists remain current.', category: 'Shelter' },
      { priority: 5, title: 'Hold logistics at normal readiness', detail: 'No pre-positioning of emergency resources required at this scenario level.', category: 'Logistics' },
    ],
    ELEVATED: [
      { priority: 1, title: 'Prepare coastal shelters', detail: 'Ready identified shelters for possible activation as the system approaches.', category: 'Evacuation' },
      { priority: 2, title: 'Alert coastal hospitals to prepare', detail: 'Notify hospitals in projected impact areas to review surge capacity plans.', category: 'Medical' },
      { priority: 3, title: 'Verify emergency communication coverage', detail: 'Confirm backup communication channels are functional across flagged zones.', category: 'Communication' },
      { priority: 4, title: 'Stage shelter supplies', detail: 'Pre-stage food, water and medical supplies at priority shelters.', category: 'Shelter' },
      { priority: 5, title: 'Ready logistics for pre-positioning', detail: 'Identify staging areas for emergency resources ahead of possible escalation.', category: 'Logistics' },
    ],
    HIGH: [
      { priority: 1, title: 'Prepare evacuation for high-risk coastal zones', detail: 'Zones showing compounding wind and storm-surge exposure should begin evacuation planning within the +12h landfall window.', category: 'Evacuation' },
      { priority: 2, title: 'Prepare hospitals in projected impact areas', detail: 'Hospitals flagged High Priority should activate surge protocols given coastal proximity and constrained access roads.', category: 'Medical' },
      { priority: 3, title: 'Verify emergency communication coverage', detail: 'Tower-outage risk is elevated in multiple zones — confirm backup comms before landfall.', category: 'Communication' },
      { priority: 4, title: 'Activate identified emergency shelters', detail: 'Open shelters nearest the highest-priority evacuation zones.', category: 'Shelter' },
      { priority: 5, title: 'Pre-position emergency response resources', detail: 'Stage relief and medical logistics near the highest-risk coastal cities ahead of the +18–24h window.', category: 'Logistics' },
    ],
    CRITICAL: [
      { priority: 1, title: 'Prioritize evacuation in high-risk coastal zones and prepare hospitals for increased emergency load', detail: 'Intensity has escalated the scenario to critical — treat coastal evacuation and hospital surge preparation as parallel, top-priority actions.', category: 'Evacuation' },
      { priority: 2, title: 'Escalate hospital emergency protocols across all flagged facilities', detail: 'Move every High-Priority hospital to full surge-capacity protocol, not just those closest to the coast.', category: 'Medical' },
      { priority: 3, title: 'Activate all backup communication channels', detail: 'Tower-outage risk is HIGH across most tracked zones — assume primary networks may fail and activate redundant channels now.', category: 'Communication' },
      { priority: 4, title: 'Open all shelters and prepare overflow capacity', detail: 'Activate every identified shelter and identify secondary overflow sites.', category: 'Shelter' },
      { priority: 5, title: 'Pre-position maximum available emergency resources immediately', detail: 'Deploy relief, medical, and rescue logistics to staging points now rather than waiting for landfall confirmation.', category: 'Logistics' },
    ],
  };
  return sets[tier];
}

// -----------------------------------------------------------------------------
// Prediction-panel helper: turns the (possibly simulated) current + forecast
// track points into the Time / Lat / Lng / Wind / Risk rows shown in the UI.
// -----------------------------------------------------------------------------
export interface DerivedPredictionRow {
  time: string;
  lat: number;
  lng: number;
  windKmh: number;
  risk: RiskLevel;
}

export function derivePredictionRows(trackPoints: TrackPoint[]): DerivedPredictionRow[] {
  return trackPoints
    .filter((p) => p.kind === 'current' || p.kind === 'forecast')
    .map((p) => ({
      time: p.label,
      lat: p.lat,
      lng: p.lng,
      windKmh: p.windKmh,
      risk: deriveRiskFromWind(p.windKmh),
    }));
}

export const baselineSimulation: SimulationResult = runSimulation(BASELINE_INPUTS);

