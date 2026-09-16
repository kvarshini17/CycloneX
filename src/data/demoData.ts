// =============================================================================
// DEMO / SIMULATED DATA — CycloneX (SIH26070 Prototype)
// =============================================================================
// Every value in this file is fabricated for demonstration purposes only.
// "Cyclone Varun" is a fictional demo scenario. Nothing here originates from
// IMD, INSAT, JTWC, or any live meteorological feed. Positions, intensities,
// risk scores and recommendations exist to illustrate the intended CycloneX
// workflow and UI to hackathon judges — they are NOT forecasts.
// =============================================================================

import type {
  City,
  CommZone,
  CycloneProfile,
  DataSource,
  EvacuationRoute,
  Hospital,
  PredictionRow,
  RiskAssessment,
  RiskZone,
  TrackPoint,
} from '../types';

export const cycloneProfile: CycloneProfile = {
  name: 'Cyclone Varun',
  basin: 'Bay of Bengal',
  stage: 'Severe Cyclonic Storm',
  windKmh: 110,
  pressureHpa: 970,
  movementDirection: 'North-North-East',
  speedKmh: 14,
  probabilityPercent: 87,
  confidencePercent: 81,
  currentLat: 16.9,
  currentLng: 83.6,
};

// Historical + current + predicted track. hourOffset drives map animation order.
export const trackPoints: TrackPoint[] = [
  { id: 't-24', label: '-24h', lat: 13.8, lng: 85.9, windKmh: 75, kind: 'history', hourOffset: -24 },
  { id: 't-18', label: '-18h', lat: 14.6, lng: 85.2, windKmh: 85, kind: 'history', hourOffset: -18 },
  { id: 't-12', label: '-12h', lat: 15.4, lng: 84.6, windKmh: 95, kind: 'history', hourOffset: -12 },
  { id: 't-6', label: '-6h', lat: 16.2, lng: 84.1, windKmh: 105, kind: 'history', hourOffset: -6 },
  { id: 't-0', label: 'Current', lat: 16.9, lng: 83.6, windKmh: 110, kind: 'current', hourOffset: 0 },
  { id: 'f-6', label: '+6h', lat: 17.7, lng: 83.1, windKmh: 113, kind: 'forecast', hourOffset: 6 },
  { id: 'f-12', label: '+12h', lat: 18.5, lng: 82.7, windKmh: 118, kind: 'forecast', hourOffset: 12 },
  { id: 'f-18', label: '+18h', lat: 19.4, lng: 82.5, windKmh: 108, kind: 'forecast', hourOffset: 18 },
  { id: 'f-24', label: '+24h', lat: 20.3, lng: 82.4, windKmh: 95, kind: 'forecast', hourOffset: 24 },
];

export const nearbyCities: City[] = [
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, population: '2.4M metro', riskLevel: 'HIGH' },
  { name: 'Kakinada', lat: 16.9891, lng: 82.2475, population: '440K', riskLevel: 'HIGH' },
  { name: 'Machilipatnam', lat: 16.1875, lng: 81.1389, population: '190K', riskLevel: 'MEDIUM' },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, population: '900K', riskLevel: 'MEDIUM' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, population: '7.1M metro', riskLevel: 'LOW' },
];

export const riskZones: RiskZone[] = [
  { id: 'rz-1', name: 'Visakhapatnam Coastal Belt', lat: 17.72, lng: 83.31, radiusKm: 35, level: 'HIGH' },
  { id: 'rz-2', name: 'Kakinada Harbour Zone', lat: 16.95, lng: 82.28, radiusKm: 28, level: 'HIGH' },
  { id: 'rz-3', name: 'Bhimunipatnam Shoreline', lat: 17.89, lng: 83.45, radiusKm: 20, level: 'HIGH' },
  { id: 'rz-4', name: 'Machilipatnam Delta', lat: 16.19, lng: 81.14, radiusKm: 30, level: 'MEDIUM' },
  { id: 'rz-5', name: 'Konaseema Inland Belt', lat: 16.6, lng: 82.0, radiusKm: 25, level: 'MEDIUM' },
  { id: 'rz-6', name: 'Godavari Delta Farmland', lat: 16.75, lng: 81.75, radiusKm: 22, level: 'LOW' },
];

export const predictionRows: PredictionRow[] = [
  { time: 'Current', lat: 16.9, lng: 83.6, windKmh: 110, risk: 'HIGH' },
  { time: '+6h', lat: 17.7, lng: 83.1, windKmh: 113, risk: 'HIGH' },
  { time: '+12h', lat: 18.5, lng: 82.7, windKmh: 118, risk: 'HIGH' },
  { time: '+18h', lat: 19.4, lng: 82.5, windKmh: 108, risk: 'MEDIUM' },
  { time: '+24h', lat: 20.3, lng: 82.4, windKmh: 95, risk: 'MEDIUM' },
];

export const riskAssessment: RiskAssessment = {
  flood: 'HIGH',
  wind: 'HIGH',
  stormSurge: 'MEDIUM',
  infrastructure: 'HIGH',
  overall: 'HIGH',
  affectedPopulation: '2.4M',
  highRiskZones: 8,
  hospitalsRequiringPrep: 14,
  sheltersIdentified: 32,
};

export const baselineRiskScore = 82;

export const hospitals: Hospital[] = [
  { name: 'King George Hospital, Vizag', risk: 'MEDIUM', accessibility: 'Good', priority: 'Prepare' },
  { name: 'Government General Hospital, Kakinada', risk: 'HIGH', accessibility: 'Moderate', priority: 'High Priority' },
  { name: 'GITAM Institute of Medical Sciences', risk: 'HIGH', accessibility: 'Good', priority: 'High Priority' },
  { name: 'Machilipatnam District Hospital', risk: 'MEDIUM', accessibility: 'Moderate', priority: 'Prepare' },
  { name: 'Rangaraya Medical College, Kakinada', risk: 'HIGH', accessibility: 'Poor', priority: 'High Priority' },
];

export const commZones: CommZone[] = [
  { zone: 'Visakhapatnam Coastal Belt', risk: 'HIGH', towersAffected: 42 },
  { zone: 'Kakinada Harbour Zone', risk: 'HIGH', towersAffected: 31 },
  { zone: 'Machilipatnam Delta', risk: 'MEDIUM', towersAffected: 18 },
  { zone: 'Konaseema Inland Belt', risk: 'MEDIUM', towersAffected: 11 },
  { zone: 'Godavari Delta Farmland', risk: 'LOW', towersAffected: 4 },
];

export const evacuationRoutes: EvacuationRoute[] = [
  { zone: 'Zone A — Vizag Fishing Harbour', shelter: 'Shelter 01 — Municipal High School', distanceKm: 3.2, priority: 'HIGH', capacity: 1200 },
  { zone: 'Zone B — Kakinada Port Colony', shelter: 'Shelter 04 — Govt Degree College', distanceKm: 5.1, priority: 'MEDIUM', capacity: 950 },
  { zone: 'Zone C — Bhimunipatnam Shoreline', shelter: 'Shelter 02 — Community Hall', distanceKm: 4.6, priority: 'HIGH', capacity: 700 },
  { zone: 'Zone D — Machilipatnam Delta', shelter: 'Shelter 07 — District Stadium', distanceKm: 6.8, priority: 'MEDIUM', capacity: 1500 },
  { zone: 'Zone E — Konaseema Inland Belt', shelter: 'Shelter 09 — Panchayat Office', distanceKm: 8.3, priority: 'LOW', capacity: 400 },
];

// Recommendation sets are now generated dynamically based on the active
// What-If scenario — see buildRecommendations() in src/utils/simulation.ts.
// The tier reached at the baseline scenario (no sliders touched) is "HIGH",
// which is the starting recommendation set judges will see by default.


export const dataSources: DataSource[] = [
  { name: 'Satellite Imagery (INSAT-3D/3DR class)', status: 'planned', description: 'Cloud-top temperature & structure imagery for detection and classification.' },
  { name: 'Weather Data', status: 'planned', description: 'Surface & upper-air observations to refine intensity estimates.' },
  { name: 'Historical Cyclone Tracks', status: 'partial-demo', description: 'Used here only to shape the illustrative demo track.' },
  { name: 'Sea Surface Temperature', status: 'planned', description: 'Key input for intensification / weakening prediction.' },
  { name: 'GIS / Geographic Data', status: 'partial-demo', description: 'Coastline, city and elevation layers used for the demo map.' },
  { name: 'Infrastructure Data', status: 'planned', description: 'Hospitals, shelters, telecom towers — currently illustrative placeholders.' },
];

// ------------------------------------------------------------------
// What-If Simulator logic now lives in src/utils/simulation.ts, which
// consumes the baseline arrays above and derives simulated scenarios from
// them deterministically. See that file for the full model.
// ------------------------------------------------------------------

