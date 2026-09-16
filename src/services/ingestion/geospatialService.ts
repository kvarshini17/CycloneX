// =============================================================================
// CycloneX — Geospatial & Infrastructure Ingestion Service (SIH26070)
// =============================================================================
// Ingestion adapter for GIS, topographic and critical infrastructure layers:
// - Coastline distance & projected landfall corridor
// - Coastal Digital Elevation Model (DEM) and bathymetric slope
// - Population vulnerability distribution (Census / WorldPop estimates)
// - Health facilities (Hospitals, Community Health Centers)
// - Cyclone shelters and designated evacuation centers
// - Telecom towers and vital infrastructure exposure
// =============================================================================

import type { GeospatialExposure } from '../../models/cycloneObservation';
import {
  commZones,
  evacuationRoutes,
  hospitals,
  nearbyCities,
  riskZones,
} from '../../data/demoData';

export class GeospatialIngestionService {
  /**
   * Evaluates coastal and infrastructure exposure for cyclone position.
   */
  public fetchExposure(_lat = 16.9, lng = 83.6): GeospatialExposure {
    // Calculate approximate distance to Andhra Pradesh coastline (~82.2E to 83.3E at 16.9N)
    // 1 degree longitude ~ 106 km at 17°N
    const coastLng = 82.35;
    const deltaLngDeg = Math.max(0, lng - coastLng);
    const distanceToCoastlineKm = Math.round(deltaLngDeg * 106.5);

    // Sum designated shelter capacity
    const shelterCapacityTotal = evacuationRoutes.reduce((acc, route) => acc + route.capacity, 0);

    // Sum affected telecom towers
    const criticalTelecomTowersAtRisk = commZones.reduce((acc, zone) => acc + zone.towersAffected, 0);

    return {
      distanceToCoastlineKm: Math.max(15, distanceToCoastlineKm),
      nearestLandfallSector: 'North Andhra Coast (Kakinada — Visakhapatnam Belt)',
      coastalElevationAvgMeters: 4.8, // Low-lying delta plain highly vulnerable to surge
      populationIn100KmRadius: 3840000,
      populationIn50KmRadius: 1420000,
      hospitalsInImpactZone: hospitals.length,
      evacuationSheltersAvailable: evacuationRoutes.length,
      shelterCapacityTotal,
      criticalTelecomTowersAtRisk,
      sourceStatus: 'AVAILABLE',
    };
  }

  public getNearbyCities() {
    return nearbyCities;
  }

  public getRiskZones() {
    return riskZones;
  }

  public getHospitals() {
    return hospitals;
  }
}

export const geospatialService = new GeospatialIngestionService();
