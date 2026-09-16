// =============================================================================
// CycloneX — Atmospheric / Weather Data Ingestion Service (SIH26070)
// =============================================================================

import type { AtmosphericObservation } from '../../models/cycloneObservation';

export interface WeatherFetchResult {
  observation: AtmosphericObservation;
  isRealLiveFetch: boolean;
  latencyMs: number;
  errorMessage?: string;
}

export class WeatherIngestionService {
  private lastFetchResult: WeatherFetchResult | null = null;

  public async fetchObservation(lat = 16.9, lng = 83.6, mode: 'REAL' | 'DEMO' = 'DEMO'): Promise<WeatherFetchResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    // DEMO / HISTORICAL FALLBACK PROFILE
    const fallbackObservation: AtmosphericObservation = {
      maxSustainedWindKmh: 110,
      windGustsKmh: 135,
      windDirectionDegrees: 205,
      centralPressureHpa: 970,
      environmentalPressureHpa: 1008,
      pressureDeficitHpa: 38,
      surfaceTemperatureCelsius: 27.8,
      relativeHumidity700HpaPercent: 84,
      verticalWindShearKnots: 11.5,
      vorticity850HpaE5PerSec: 14.2,
      sourceName: 'Bay of Bengal Synoptic Chart (DEMO REPLAY)',
      sourceStatus: 'SAMPLE_DATA',
      isRealLiveFetch: false,
      lastUpdated: timestamp,
    };

    if (mode === 'DEMO') {
      const result: WeatherFetchResult = {
        observation: fallbackObservation,
        isRealLiveFetch: false,
        latencyMs: Math.round(performance.now() - startTime),
      };
      this.lastFetchResult = result;
      return result;
    }

    try {
      // REAL DATA MODE: Hit our API layer
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/data/weather?lat=${lat}&lng=${lng}`);
      
      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }

      const payload = await response.json();
      const latency = Math.round(performance.now() - startTime);

      if (payload.success && payload.data) {
        const result: WeatherFetchResult = {
          observation: payload.data,
          isRealLiveFetch: true,
          latencyMs: latency,
        };
        this.lastFetchResult = result;
        return result;
      }
      throw new Error('Invalid payload structure from API');
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - startTime);
      const message = err instanceof Error ? err.message : 'API unreachable';
      
      const result: WeatherFetchResult = {
        observation: {
          ...fallbackObservation,
          sourceName: 'NO QUALIFYING ACTIVE CYCLONE DETECTED',
          sourceStatus: 'UNAVAILABLE'
        },
        isRealLiveFetch: false,
        latencyMs: latency,
        errorMessage: message,
      };
      this.lastFetchResult = result;
      return result;
    }
  }

  public getLastFetch(): WeatherFetchResult | null {
    return this.lastFetchResult;
  }
}

export const weatherService = new WeatherIngestionService();


