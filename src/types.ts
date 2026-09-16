// Shared type definitions for CycloneX demo data.
// All values sourced from src/data/demoData.ts are SIMULATED / DEMO values
// created for the SIH26070 proof-of-concept. None represent real,
// operational, or IMD-issued cyclone data.

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TrackPoint {
  id: string;
  label: string; // e.g. "-24h", "Current", "+6h"
  lat: number;
  lng: number;
  windKmh: number;
  kind: 'history' | 'current' | 'forecast';
  hourOffset: number; // negative = past, 0 = now, positive = future
}

export interface City {
  name: string;
  lat: number;
  lng: number;
  population: string;
  riskLevel: RiskLevel;
}

export interface RiskZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  level: RiskLevel;
}

export interface CycloneProfile {
  name: string;
  basin: string;
  stage: string;
  windKmh: number;
  pressureHpa: number;
  movementDirection: string;
  speedKmh: number;
  probabilityPercent: number;
  confidencePercent: number;
  currentLat: number;
  currentLng: number;
}

export interface PredictionRow {
  time: string;
  lat: number;
  lng: number;
  windKmh: number;
  risk: RiskLevel;
}

export interface RiskAssessment {
  flood: RiskLevel;
  wind: RiskLevel;
  stormSurge: RiskLevel;
  infrastructure: RiskLevel;
  overall: RiskLevel;
  affectedPopulation: string;
  highRiskZones: number;
  hospitalsRequiringPrep: number;
  sheltersIdentified: number;
}

export interface Hospital {
  name: string;
  risk: RiskLevel;
  accessibility: 'Good' | 'Moderate' | 'Poor';
  priority: 'Monitor' | 'Prepare' | 'High Priority';
}

export interface CommZone {
  zone: string;
  risk: RiskLevel;
  towersAffected: number;
}

export interface EvacuationRoute {
  zone: string;
  shelter: string;
  distanceKm: number;
  priority: RiskLevel;
  capacity: number;
}

export interface Recommendation {
  priority: number;
  title: string;
  detail: string;
  category: 'Evacuation' | 'Medical' | 'Communication' | 'Shelter' | 'Logistics';
}

export interface DataSource {
  name: string;
  status: 'planned' | 'partial-demo';
  description: string;
}
