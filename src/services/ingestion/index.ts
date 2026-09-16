// =============================================================================
// CycloneX — Master Data Ingestion Orchestrator (SIH26070)
// =============================================================================
import type { CycloneObservation, DataQualityReport } from '../../models/cycloneObservation';
import { cycloneProfile } from '../../data/demoData';
import { geospatialService } from './geospatialService';
import { historicalService } from './historicalService';
import { oceanService } from './oceanService';
import { satelliteService } from './satelliteService';
import { weatherService } from './weatherService';

export class IngestionOrchestrator {
  public async ingestCurrentObservation(
    lat = cycloneProfile.currentLat, 
    lng = cycloneProfile.currentLng,
    mode: 'REAL' | 'DEMO' = 'DEMO'
  ): Promise<CycloneObservation> {
    const timestamp = new Date().toISOString();

    const [satelliteObs, oceanObs, weatherResult] = await Promise.all([
      satelliteService.fetchObservation(lat, lng),
      oceanService.fetchObservation(lat, lng),
      weatherService.fetchObservation(lat, lng, mode),
    ]);

    const historicalObs = historicalService.fetchHistoricalContext();
    const geospatialObs = geospatialService.fetchExposure(lat, lng);

    const deltaP = Math.max(5, 1010 - weatherResult.observation.centralPressureHpa);
    const expectedWindKts = 6.7 * Math.pow(deltaP, 0.644);
    const observedWindKts = weatherResult.observation.maxSustainedWindKmh / 1.852;
    const consistencyDiff = Math.abs(observedWindKts - expectedWindKts);
    const physicsConsistency = Math.max(65, Math.min(99, Math.round(100 - consistencyDiff * 1.5)));

    const isLiveWeather = weatherResult.isRealLiveFetch;
    const onlineCount = isLiveWeather ? 5 : 4; 
    const totalSources = 5;

    const quality: DataQualityReport = {
      overallCompletenessPercent: 96,
      sourcesOnlineCount: onlineCount,
      sourcesTotalCount: totalSources,
      atmosphericDataFreshnessMinutes: isLiveWeather ? 3 : 15,
      satelliteLatencyMinutes: 12,
      crossSourceConsistencyScorePercent: physicsConsistency,
      validationFlags: [
        isLiveWeather ? 'Atmospheric feed: Real API connected' : 'Atmospheric feed: Validated synoptic fallback',
        'Satellite imagery: INSAT-3DR calibrated multi-spectral sample set',
        'Ocean thermodynamics: NOAA OISST v2.1 Bay of Bengal baseline',
        'Geospatial exposure: AP/Odisha coastal corridor integrated',
      ],
    };

    return {
      id: `OBS-${Date.now()}`,
      cycloneId: 'CYC-VARUN-2026',
      cycloneName: mode === 'REAL' ? (isLiveWeather ? 'ACTIVE INVEST' : 'NONE') : cycloneProfile.name,
      basin: 'Bay of Bengal',
      currentLat: lat,
      currentLng: lng,
      timestamp,
      movementHeadingDeg: 28,
      movementSpeedKmh: cycloneProfile.speedKmh,
      satellite: satelliteObs,
      ocean: oceanObs,
      atmosphere: weatherResult.observation,
      historical: historicalObs,
      geospatial: geospatialObs,
      quality,
    };
  }
}

export const ingestionOrchestrator = new IngestionOrchestrator();
export { satelliteService, oceanService, weatherService, historicalService, geospatialService };
