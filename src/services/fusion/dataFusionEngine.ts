// =============================================================================
// CycloneX — Multi-Source Data Fusion Engine (SIH26070)
// =============================================================================
// Multi-source inputs → Preprocessing → Feature Fusion → AI/ML Ready Tensor
//
// This engine takes heterogeneous observations from:
// 1. Satellite Imagery (VIS, IR, WV structural features)
// 2. Ocean Telemetry (SST, SST Anomaly, Ocean Heat Content)
// 3. Atmospheric Parameters (Wind, Pressure Deficit, Shear, Moisture, Vorticity)
// 4. Historical Track Data (Past 24h intensification, motion vector)
// 5. Geospatial & Topographic Data (Coastline distance, elevation, population exposure)
//
// And mathematically scales, balances, and fuses them into a unified,
// normalized numerical feature vector ready for downstream AI/ML models.
// =============================================================================

import type { CycloneObservation, FusedCycloneFeatureVector } from '../../models/cycloneObservation';
import type { ExtractedSatelliteFeatures } from '../preprocessing/satellitePreprocessor';

export interface FusionCategoryBreakdown {
  category: 'SATELLITE' | 'OCEAN' | 'ATMOSPHERE' | 'HISTORICAL' | 'GEOSPATIAL';
  featureCount: number;
  averageNormalizedScore: number;
  dataFreshnessStatus: string;
  sourceAttribution: string;
}

export class DataFusionEngine {
  /**
   * Transforms raw multi-source observation into a normalized, balanced feature vector.
   */
  public fuseObservation(
    obs: CycloneObservation,
    satFeatures?: ExtractedSatelliteFeatures
  ): FusedCycloneFeatureVector {
    const timestamp = new Date().toISOString();

    // 1. Satellite features (defaulting to observation metrics if preprocessing features not passed)
    const minTemp = satFeatures?.cloudTopMinTempCelsius ?? obs.satellite.cloudTopMinTempCelsius;
    // Invert cloud-top temp: -85°C -> 1.0 (extreme convection), -30°C -> 0.0
    const satCloudTopMinTempNorm = Math.max(0, Math.min(1, (-minTemp - 30) / 55));
    const satEyeDefinitionNorm = satFeatures?.convectiveSymmetryScore ?? obs.satellite.centralEyeDefinitionScore;
    const satConvectiveSymmetryNorm = 1 - obs.satellite.convectiveAsymmetryIndex;
    const satSpiralTightnessNorm = obs.satellite.spiralBandingTightness;

    // 2. Ocean features
    // SST range 26°C (threshold) to 31°C (extreme warm pool)
    const oceanSstNorm = Math.max(0, Math.min(1, (obs.ocean.sstCelsius - 26.0) / 5.0));
    // SST Anomaly range -1.5°C to +2.5°C
    const oceanSstAnomalyNorm = Math.max(0, Math.min(1, (obs.ocean.sstAnomalyCelsius + 1.5) / 4.0));
    // Ocean Heat Content range 0 to 120 kJ/cm²
    const oceanHeatContentNorm = Math.max(0, Math.min(1, obs.ocean.oceanHeatContentKjCm2 / 120));

    // 3. Atmospheric features
    // Sustained wind: 0 to 250 km/h
    const atmWindSpeedNorm = Math.max(0, Math.min(1, obs.atmosphere.maxSustainedWindKmh / 250));
    // Pressure deficit: (1010 - Pc) -> 0 to 70 hPa
    const atmPressureDeficitNorm = Math.max(0, Math.min(1, obs.atmosphere.pressureDeficitHpa / 70));
    // Shear: <10 kts is 1.0 (ideal), >35 kts is 0.0 (inhibitive)
    const atmShearFavourabilityNorm = Math.max(0, Math.min(1, 1 - (obs.atmosphere.verticalWindShearKnots - 5) / 30));
    // 700 hPa relative humidity: 50% to 100%
    const atmHumidity700Norm = Math.max(0, Math.min(1, (obs.atmosphere.relativeHumidity700HpaPercent - 50) / 50));
    // Vorticity: 0 to 20 x10^-5 s^-1
    const atmVorticityNorm = Math.max(0, Math.min(1, obs.atmosphere.vorticity850HpaE5PerSec / 20));
    // Central pressure inverted: 920 hPa -> 1.0, 1005 hPa -> 0.0
    const atmPressureNorm = Math.max(0, Math.min(1, (1005 - obs.atmosphere.centralPressureHpa) / 85));

    // 4. Historical features
    // 24h wind change: -30 km/h (decay) to +60 km/h (rapid intensification)
    const hist24hIntensificationNorm = Math.max(0, Math.min(1, (obs.historical.intensificationRate24hKmh + 30) / 90));
    // Translation speed: 0 to 35 km/h
    const histMotionSpeedNorm = Math.max(0, Math.min(1, obs.movementSpeedKmh / 35));
    // Heading sine (directional component towards northern coast)
    const histHeadingSine = (Math.sin((obs.movementHeadingDeg * Math.PI) / 180) + 1) / 2;

    // 5. Geospatial exposure features
    // Proximity to coast: 0 km (landfall) -> 1.0, 400 km -> 0.0
    const geoCoastDistanceNorm = Math.max(0, Math.min(1, 1 - obs.geospatial.distanceToCoastlineKm / 400));
    // Coastal low elevation vulnerability: 0m (sea level) -> 1.0, 20m -> 0.0
    const geoElevationVulnerabilityNorm = Math.max(0, Math.min(1, 1 - obs.geospatial.coastalElevationAvgMeters / 20));
    // Population exposure: 0 to 5M in 100km radius
    const geoPopulationExposureNorm = Math.max(0, Math.min(1, obs.geospatial.populationIn100KmRadius / 5000000));

    const features = {
      satCloudTopMinTempNorm: Math.round(satCloudTopMinTempNorm * 1000) / 1000,
      satEyeDefinitionNorm: Math.round(satEyeDefinitionNorm * 1000) / 1000,
      satConvectiveSymmetryNorm: Math.round(satConvectiveSymmetryNorm * 1000) / 1000,
      satSpiralTightnessNorm: Math.round(satSpiralTightnessNorm * 1000) / 1000,
      oceanSstNorm: Math.round(oceanSstNorm * 1000) / 1000,
      oceanSstAnomalyNorm: Math.round(oceanSstAnomalyNorm * 1000) / 1000,
      oceanHeatContentNorm: Math.round(oceanHeatContentNorm * 1000) / 1000,
      atmWindSpeedNorm: Math.round(atmWindSpeedNorm * 1000) / 1000,
      atmPressureDeficitNorm: Math.round(atmPressureDeficitNorm * 1000) / 1000,
      atmShearFavourabilityNorm: Math.round(atmShearFavourabilityNorm * 1000) / 1000,
      atmHumidity700Norm: Math.round(atmHumidity700Norm * 1000) / 1000,
      atmVorticityNorm: Math.round(atmVorticityNorm * 1000) / 1000,
      atmPressureNorm: Math.round(atmPressureNorm * 1000) / 1000,
      hist24hIntensificationNorm: Math.round(hist24hIntensificationNorm * 1000) / 1000,
      histMotionSpeedNorm: Math.round(histMotionSpeedNorm * 1000) / 1000,
      histHeadingSine: Math.round(histHeadingSine * 1000) / 1000,
      geoCoastDistanceNorm: Math.round(geoCoastDistanceNorm * 1000) / 1000,
      geoElevationVulnerabilityNorm: Math.round(geoElevationVulnerabilityNorm * 1000) / 1000,
      geoPopulationExposureNorm: Math.round(geoPopulationExposureNorm * 1000) / 1000,
    };

    const vectorValues = Object.values(features);
    const featureLabels = Object.keys(features);

    return {
      cycloneId: obs.cycloneId,
      timestamp,
      features,
      vectorValues,
      featureLabels,
      completenessScore: obs.quality.overallCompletenessPercent,
      fusionTimestamp: timestamp,
    };
  }

  /**
   * Generates a high-level summary breakdown of features across the 5 domains.
   */
  public getCategoryBreakdowns(vector: FusedCycloneFeatureVector): FusionCategoryBreakdown[] {
    const f = vector.features;

    const satAvg = (f.satCloudTopMinTempNorm + f.satEyeDefinitionNorm + f.satConvectiveSymmetryNorm + f.satSpiralTightnessNorm) / 4;
    const oceanAvg = (f.oceanSstNorm + f.oceanSstAnomalyNorm + f.oceanHeatContentNorm) / 3;
    const atmAvg = (f.atmWindSpeedNorm + f.atmPressureDeficitNorm + f.atmShearFavourabilityNorm + f.atmHumidity700Norm + f.atmVorticityNorm + f.atmPressureNorm) / 6;
    const histAvg = (f.hist24hIntensificationNorm + f.histMotionSpeedNorm + f.histHeadingSine) / 3;
    const geoAvg = (f.geoCoastDistanceNorm + f.geoElevationVulnerabilityNorm + f.geoPopulationExposureNorm) / 3;

    return [
      {
        category: 'SATELLITE',
        featureCount: 4,
        averageNormalizedScore: Math.round(satAvg * 100) / 100,
        dataFreshnessStatus: 'INSAT-3DR 15-min cadence (Sample)',
        sourceAttribution: 'ISRO / MOSDAC Imager Bands (VIS, TIR1, WV)',
      },
      {
        category: 'OCEAN',
        featureCount: 3,
        averageNormalizedScore: Math.round(oceanAvg * 100) / 100,
        dataFreshnessStatus: 'Daily 5km OISST grid (Sample)',
        sourceAttribution: 'NOAA CRW / INCOIS Bay of Bengal Array',
      },
      {
        category: 'ATMOSPHERE',
        featureCount: 6,
        averageNormalizedScore: Math.round(atmAvg * 100) / 100,
        dataFreshnessStatus: 'Live query / 1-hour interval',
        sourceAttribution: 'Open-Meteo Open Weather API / Synoptic Analysis',
      },
      {
        category: 'HISTORICAL',
        featureCount: 3,
        averageNormalizedScore: Math.round(histAvg * 100) / 100,
        dataFreshnessStatus: 'Best-track archive updated 6-hourly',
        sourceAttribution: 'NOAA IBTrACS v04 / IMD Cyclone e-Atlas',
      },
      {
        category: 'GEOSPATIAL',
        featureCount: 3,
        averageNormalizedScore: Math.round(geoAvg * 100) / 100,
        dataFreshnessStatus: 'Static coastal & infrastructure DEM',
        sourceAttribution: 'OpenStreetMap / Census & Health Infrastructure GIS',
      },
    ];
  }
}

export const dataFusionEngine = new DataFusionEngine();
