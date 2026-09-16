// =============================================================================
// CycloneX — Ocean Data Ingestion Service (SIH26070)
// =============================================================================
// Ingestion adapter for oceanic thermodynamic parameters:
// - Sea Surface Temperature (SST, in °C): Primary thermal engine (>26.5°C needed)
// - SST Climatological Anomaly (°C): Warm pool indicator fueling rapid intensification
// - Ocean Heat Content (OHC, kJ/cm²): Integrated thermal energy to 26°C isotherm
// - Isothermal Layer Depth (m): Barrier layer stability preventing cold upwelling
//
// Target scientific sources:
// - NOAA Coral Reef Watch (CRW) daily 5km SST
// - NOAA OISST v2.1 high-resolution blended product
// - INCOIS (Indian National Centre for Ocean Information Services) Bay of Bengal buoy array
// =============================================================================

import type { OceanObservation } from '../../models/cycloneObservation';

export interface OceanTelemetryGridPoint {
  lat: number;
  lng: number;
  sstCelsius: number;
  sstAnomalyCelsius: number;
  depth26CIsotherm: number;
}

export class OceanIngestionService {
  /**
   * Returns sea surface thermodynamic parameters for the cyclone coordinates in the Bay of Bengal.
   */
  public async fetchObservation(_cycloneLat = 16.9, _cycloneLng = 83.6): Promise<OceanObservation> {
    const timestamp = new Date().toISOString();

    // Baseline Bay of Bengal warm pool conditions
    // Lat 16.9N, Long 83.6E (West-Central Bay off Andhra Coast)
    const baseSst = 29.4;
    const baseAnomaly = +1.2;
    const baseOhc = 74.5; // kJ/cm² (>50 kJ/cm² supports rapid intensification)

    return {
      sstCelsius: baseSst,
      sstAnomalyCelsius: baseAnomaly,
      oceanHeatContentKjCm2: baseOhc,
      isothermalLayerDepthMeters: 65,
      sourceName: 'NOAA OISST v2.1 / INCOIS Bay of Bengal Buoy Array',
      sourceStatus: 'SAMPLE_DATA',
      lastUpdated: timestamp,
    };
  }

  /**
   * Spatial transect along coastal Andhra/Odisha waters showing SST gradients
   */
  public getSpatialTransect(): OceanTelemetryGridPoint[] {
    return [
      { lat: 14.0, lng: 84.5, sstCelsius: 29.8, sstAnomalyCelsius: +1.4, depth26CIsotherm: 72 },
      { lat: 15.5, lng: 84.0, sstCelsius: 29.6, sstAnomalyCelsius: +1.3, depth26CIsotherm: 68 },
      { lat: 16.9, lng: 83.6, sstCelsius: 29.4, sstAnomalyCelsius: +1.2, depth26CIsotherm: 65 }, // Storm Center
      { lat: 18.0, lng: 83.3, sstCelsius: 29.1, sstAnomalyCelsius: +0.9, depth26CIsotherm: 58 },
      { lat: 19.5, lng: 84.0, sstCelsius: 28.7, sstAnomalyCelsius: +0.6, depth26CIsotherm: 52 },
    ];
  }
}

export const oceanService = new OceanIngestionService();
