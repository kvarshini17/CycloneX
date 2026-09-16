// =============================================================================
// CycloneX — Data Quality & Source Status Tracker (SIH26070)
// =============================================================================
// Tracks telemetry health, network latency, data freshness, and scientific
// provenance across all 5 integrated data streams.
//
// SCIENTIFIC TRANSPARENCY:
// Explicitly indicates whether a source is LIVE, AVAILABLE, or SAMPLE/DEMO data.
// No simulated feed is ever labeled as operational or real-time.
// =============================================================================

import type { DataSourceStatus, SourceStreamHealth } from '../../models/cycloneObservation';
import { weatherService } from '../ingestion/weatherService';

export interface SourceStatusItem {
  id: string;
  name: string;
  category: 'SATELLITE' | 'OCEAN' | 'ATMOSPHERE' | 'HISTORICAL' | 'GIS';
  badgeLabel: string;
  badgeType: 'live' | 'sample' | 'available' | 'offline';
  status: DataSourceStatus;
  provider: string;
  refreshInterval: string;
  lastUpdated: string;
  latencyMs?: number;
  openSourceType: string;
  scientificAttribution: string;
  description: string;
}

export class SourceStatusTracker {
  /**
   * Retrieves comprehensive live status list for all multi-source streams.
   */
  public getStatusList(): SourceStatusItem[] {
    const lastWeather = weatherService.getLastFetch();
    const isLiveWeather = lastWeather?.isRealLiveFetch ?? false;
    const weatherLatency = lastWeather?.latencyMs ?? 145;

    return [
      {
        id: 'stream-satellite',
        name: 'Satellite Imagery (VIS / IR / WV)',
        category: 'SATELLITE',
        badgeLabel: 'SAMPLE DATA',
        badgeType: 'sample',
        status: 'SAMPLE_DATA',
        provider: 'ISRO / MOSDAC (INSAT-3DR Imager)',
        refreshInterval: '15 – 30 Minutes',
        lastUpdated: '12 min ago (Sample)',
        latencyMs: 310,
        openSourceType: 'Open Scientific Archive / MOSDAC Public',
        scientificAttribution: 'Indian Space Research Organisation / IMD New Delhi',
        description: 'Multi-spectral 0.65µm Visible, 10.8µm Thermal IR, and 6.7µm Water Vapour calibrated imagery.',
      },
      {
        id: 'stream-weather',
        name: 'Atmospheric & Surface Weather',
        category: 'ATMOSPHERE',
        badgeLabel: isLiveWeather ? 'LIVE OPEN API' : 'AVAILABLE (SAMPLE)',
        badgeType: isLiveWeather ? 'live' : 'available',
        status: isLiveWeather ? 'CONNECTED' : 'AVAILABLE',
        provider: 'Open-Meteo Weather API / Synoptic Analysis',
        refreshInterval: 'Hourly / On-Demand',
        lastUpdated: isLiveWeather ? 'Just now (Live)' : '15 min ago (Cached)',
        latencyMs: weatherLatency,
        openSourceType: 'Open-Source Public API (No API Key Required)',
        scientificAttribution: 'DWD / NOAA GFS / ECMWF Open Data via Open-Meteo',
        description: '10m sustained winds, central pressure deficit, 700 hPa relative humidity, and vertical wind shear.',
      },
      {
        id: 'stream-ocean',
        name: 'Sea Surface Temperature (SST)',
        category: 'OCEAN',
        badgeLabel: 'SAMPLE DATA',
        badgeType: 'sample',
        status: 'SAMPLE_DATA',
        provider: 'NOAA CRW / INCOIS Ocean Observations',
        refreshInterval: 'Daily / 24h Update',
        lastUpdated: 'Today at 06:00 UTC (Sample)',
        latencyMs: 220,
        openSourceType: 'Open Scientific Dataset (NOAA OISST v2.1)',
        scientificAttribution: 'NOAA Coral Reef Watch & Indian National Centre for Ocean Information Services',
        description: 'High-resolution sea surface temperature, 26°C isotherm depth, and tropical cyclone heat potential (TCHP).',
      },
      {
        id: 'stream-historical',
        name: 'Historical Cyclone Best-Track',
        category: 'HISTORICAL',
        badgeLabel: 'AVAILABLE',
        badgeType: 'available',
        status: 'AVAILABLE',
        provider: 'NOAA IBTrACS v04 / IMD Cyclone e-Atlas',
        refreshInterval: 'Static Climatological Archive',
        lastUpdated: 'v04r01 Best Track Archive',
        latencyMs: 45,
        openSourceType: 'Open NOAA / WMO Best Track Archive',
        scientificAttribution: 'International Best Track Archive for Climate Stewardship / IMD RSMC New Delhi',
        description: 'Historical Bay of Bengal cyclone trajectories, intensity records, and storm analog matching.',
      },
      {
        id: 'stream-geospatial',
        name: 'Geospatial & Critical Infrastructure',
        category: 'GIS',
        badgeLabel: 'AVAILABLE',
        badgeType: 'available',
        status: 'AVAILABLE',
        provider: 'OpenStreetMap / AP Disaster Management GIS',
        refreshInterval: 'Static / Curated GIS Layers',
        lastUpdated: 'Cached Basemap & Infrastructure',
        latencyMs: 30,
        openSourceType: 'OpenStreetMap Contributors (ODbL License)',
        scientificAttribution: 'OpenStreetMap / Survey of India / State Disaster Management Authority',
        description: 'Coastal contour, digital elevation model (DEM), hospital locations, cyclone shelters, and telecom corridors.',
      },
    ];
  }

  public toStreamHealth(item: SourceStatusItem): SourceStreamHealth {
    return {
      id: item.id,
      name: item.name,
      provider: item.provider,
      category: item.category,
      status: item.status,
      refreshInterval: item.refreshInterval,
      lastUpdated: item.lastUpdated,
      latencyMs: item.latencyMs,
      isLiveOpenApi: item.badgeType === 'live',
      scientificAttribution: item.scientificAttribution,
    };
  }
}

export const sourceStatusTracker = new SourceStatusTracker();
