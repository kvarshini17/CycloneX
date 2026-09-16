// =============================================================================
// CycloneX — Normalized Multi-Source Cyclone Data Models (SIH26070)
// =============================================================================
// This module provides the central normalized schemas for multi-source
// observation data combining satellite imagery bands, ocean telemetry,
// atmospheric parameters, historical track archives, and geospatial exposure.
// =============================================================================

export type DataSourceStatus = 'CONNECTED' | 'AVAILABLE' | 'SAMPLE_DATA' | 'UNAVAILABLE' | 'PLANNED';

export type CycloneBasin = 'Bay of Bengal' | 'Arabian Sea' | 'North Indian Ocean';

export type SpectralBand = 'VISIBLE' | 'INFRARED' | 'WATER_VAPOUR' | 'MICROWAVE';

export interface SatelliteBandMetadata {
  band: SpectralBand;
  wavelengthMicrons: number; // e.g. 0.65 for VIS, 10.8 for TIR1, 6.7 for WV
  satellitePlatform: string; // e.g. "INSAT-3DR", "INSAT-3D", "GOES-16"
  sensor: string;            // e.g. "IMAGER"
  resolutionKm: number;      // e.g. 1.0 km for VIS, 4.0 km for IR
  acquisitionTimestamp: string;
  sourceStatus: DataSourceStatus;
  calibrationUnits: string;  // e.g. "Albedo %" or "Brightness Temp (Kelvin)"
  minObservedValue: number;
  maxObservedValue: number;
  /** Synthetic/real pixel grid (normalized [0,1]) for client visualization & RoI extraction */
  sampleGridWidth: number;
  sampleGridHeight: number;
  pixelDataSummary?: string;
}

export interface SatelliteObservation {
  visible: SatelliteBandMetadata;
  infrared: SatelliteBandMetadata;
  waterVapour: SatelliteBandMetadata;
  microwave?: SatelliteBandMetadata;
  cloudTopMinTempCelsius: number;     // e.g. -78.5°C
  centralEyeDefinitionScore: number;  // 0.0 (ragged/indistinct) to 1.0 (clear pinhole eye)
  convectiveAsymmetryIndex: number;   // 0.0 (symmetric) to 1.0 (highly sheared)
  cdoDiameterKm: number;              // Central Dense Overcast diameter
  spiralBandingTightness: number;     // 0.0 to 1.0
  dvorakTNumberEstimate?: number;     // e.g. T4.0, T4.5
}

export interface OceanObservation {
  sstCelsius: number;                 // Sea Surface Temperature at cyclone center, e.g. 29.4°C
  sstAnomalyCelsius: number;          // Deviation from climatological normal, e.g. +1.2°C
  oceanHeatContentKjCm2: number;      // Ocean Heat Content (fuel for rapid intensification)
  isothermalLayerDepthMeters?: number;// Depth of 26°C isotherm (e.g. 75m)
  sourceName: string;                 // e.g. "NOAA OISST / Coral Reef Watch"
  sourceStatus: DataSourceStatus;
  lastUpdated: string;
}

export interface AtmosphericObservation {
  maxSustainedWindKmh: number;        // 10m 3-minute sustained wind
  windGustsKmh: number;
  windDirectionDegrees: number;       // Compass heading from which wind blows (0-360)
  centralPressureHpa: number;         // Minimum central pressure
  environmentalPressureHpa: number;   // Outer closed isobar pressure (typically ~1008 hPa)
  pressureDeficitHpa: number;         // (environmental - central)
  surfaceTemperatureCelsius: number;  // Ambient surface air temp
  relativeHumidity700HpaPercent: number; // Mid-level tropospheric moisture (dry air inhibitor)
  verticalWindShearKnots: number;     // 200 hPa - 850 hPa differential shear (<15 kts = favorable)
  vorticity850HpaE5PerSec: number;    // Low-level cyclonic spin (x10^-5 s^-1)
  sourceName: string;                 // e.g. "Open-Meteo Weather API / IMD Synoptic Chart"
  sourceStatus: DataSourceStatus;
  isRealLiveFetch: boolean;
  lastUpdated: string;
}

export interface HistoricalTrackPointRecord {
  id: string;
  timestamp: string;
  hourOffset: number;
  latitude: number;
  longitude: number;
  windKmh: number;
  pressureHpa: number;
  category: string;
  source: 'IBTrACS' | 'IMD_ARCHIVE' | 'REAL_TIME_ANALYSIS';
}

export interface AnalogCyclone {
  name: string;
  year: number;
  basin: CycloneBasin;
  peakCategory: string;
  maxWindKmh: number;
  minPressureHpa: number;
  similarityScorePercent: number;
  trackSummary: string;
}

export interface HistoricalContext {
  previousTrack: HistoricalTrackPointRecord[];
  intensificationRate24hKmh: number; // change in wind speed over last 24h
  analogCyclones: AnalogCyclone[];
  datasetSource: string;             // e.g. "NOAA IBTrACS v04r01"
  sourceStatus: DataSourceStatus;
}

export interface GeospatialExposure {
  distanceToCoastlineKm: number;
  nearestLandfallSector: string;     // e.g. "North Andhra Coast (Kakinada-Visakhapatnam)"
  coastalElevationAvgMeters: number;
  populationIn100KmRadius: number;
  populationIn50KmRadius: number;
  hospitalsInImpactZone: number;
  evacuationSheltersAvailable: number;
  shelterCapacityTotal: number;
  criticalTelecomTowersAtRisk: number;
  sourceStatus: DataSourceStatus;
}

export interface SourceStreamHealth {
  id: string;
  name: string;
  provider: string;
  category: 'SATELLITE' | 'OCEAN' | 'ATMOSPHERE' | 'HISTORICAL' | 'GIS';
  status: DataSourceStatus;
  refreshInterval: string;
  lastUpdated: string;
  latencyMs?: number;
  isLiveOpenApi: boolean;
  scientificAttribution: string;
}

export interface DataQualityReport {
  overallCompletenessPercent: number;
  sourcesOnlineCount: number;
  sourcesTotalCount: number;
  atmosphericDataFreshnessMinutes: number;
  satelliteLatencyMinutes: number;
  crossSourceConsistencyScorePercent: number; // Physics consistency (e.g. wind-pressure-SST balance)
  validationFlags: string[];
}

/**
 * Clean normalized aggregate representation for a multi-source cyclone observation.
 * This is the central entity passed into preprocessing and data fusion.
 */
export interface CycloneObservation {
  id: string;
  cycloneId: string;
  cycloneName: string;
  basin: CycloneBasin;
  currentLat: number;
  currentLng: number;
  timestamp: string;
  movementHeadingDeg: number;
  movementSpeedKmh: number;

  satellite: SatelliteObservation;
  ocean: OceanObservation;
  atmosphere: AtmosphericObservation;
  historical: HistoricalContext;
  geospatial: GeospatialExposure;

  quality: DataQualityReport;
}

/**
 * Normalized numerical feature vector generated by the multi-source fusion engine,
 * ready to feed future AI/ML models (Detection, Classification, Track, Intensity).
 */
export interface FusedCycloneFeatureVector {
  cycloneId: string;
  timestamp: string;
  
  // Normalized features (scaled to [0, 1] or standard z-scores)
  features: {
    // Satellite features (4)
    satCloudTopMinTempNorm: number;     // inverted (colder = higher index)
    satEyeDefinitionNorm: number;       // 0..1
    satConvectiveSymmetryNorm: number;  // 1 - asymmetry (higher = more symmetric)
    satSpiralTightnessNorm: number;     // 0..1
    
    // Ocean features (3)
    oceanSstNorm: number;               // scaled around 26-31°C
    oceanSstAnomalyNorm: number;        // scaled around -2 to +2°C
    oceanHeatContentNorm: number;       // scaled 0..150 kJ/cm²
    
    // Atmospheric features (6)
    atmWindSpeedNorm: number;           // scaled 0..300 km/h
    atmPressureDeficitNorm: number;     // scaled 0..100 hPa
    atmShearFavourabilityNorm: number;  // low shear = higher score
    atmHumidity700Norm: number;         // 0..1
    atmVorticityNorm: number;           // scaled low-level vorticity
    atmPressureNorm: number;            // central pressure inverted (lower = higher)
    
    // Historical features (3)
    hist24hIntensificationNorm: number; // rate of past wind change
    histMotionSpeedNorm: number;        // forward translation speed
    histHeadingSine: number;            // directional sin component
    
    // Geospatial features (3)
    geoCoastDistanceNorm: number;       // proximity to land
    geoElevationVulnerabilityNorm: number; // low elevation = high vulnerability
    geoPopulationExposureNorm: number;  // density in core
  };

  /** Vector array representation for linear algebra / neural tensor consumption */
  vectorValues: number[];
  featureLabels: string[];
  completenessScore: number;
  fusionTimestamp: string;
}
