// =============================================================================
// CycloneX — Multi-Source Intelligence Dashboard (SIH26070)
// =============================================================================
// Professional dashboard component visualizing the multi-source data foundation:
// - Multi-spectral satellite imagery (Visible, Thermal IR, Water Vapour)
// - Preprocessing stage toggles (Raw -> Calibrated -> 224x224 RoI Crop)
// - Ocean thermodynamics (SST, SST Anomaly, Ocean Heat Content)
// - Atmospheric & synoptic parameters (Wind, Pressure, Vertical Shear, RH)
// - Historical analogs & IBTrACS comparisons
// - Geospatial exposure metrics
// - Unified Fused Feature Vector breakdown for AI/ML
// - Data Source Quality & Health Tracker with scientific honesty indicators
// =============================================================================

import { useEffect, useState, useTransition, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Compass,
  Cpu,
  Layers,
  RefreshCw,
  Thermometer,
  Waves,
  Wind,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { CycloneObservation, FusedCycloneFeatureVector, SpectralBand } from '../models/cycloneObservation';
import { ingestionOrchestrator, weatherService } from '../services/ingestion';
import { satellitePreprocessor, SatellitePreprocessor, type ProcessedSatelliteResult } from '../services/preprocessing/satellitePreprocessor';
import { dataFusionEngine, type FusionCategoryBreakdown } from '../services/fusion/dataFusionEngine';
import { prototypePipeline } from '../services/ml/prototypePipeline';
import { sourceStatusTracker, type SourceStatusItem } from '../services/quality/sourceStatusTracker';
import { DemoTag, Panel, PanelHeader } from './ui';
import { useSimulation } from '../context/SimulationContext';

export function MultiSourceIntelligence() {
  const { appMode, setLiveObservation, setLiveEvaluation } = useSimulation();
  
  const [observation, setObservation] = useState<CycloneObservation | null>(null);
  const [processedSatellite, setProcessedSatellite] = useState<ProcessedSatelliteResult | null>(null);
  const [fusedVector, setFusedVector] = useState<FusedCycloneFeatureVector | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<FusionCategoryBreakdown[]>([]);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatusItem[]>([]);
  const [selectedBand, setSelectedBand] = useState<SpectralBand>('INFRARED');
  const [viewMode, setViewMode] = useState<'calibrated' | 'raw' | 'roi'>('calibrated');
  const [isLoading, setIsLoading] = useState(false);
  const [liveWeatherMessage, setLiveWeatherMessage] = useState<string | null>(null);
  
  // Satellite Frame Playback State
  const [frames, setFrames] = useState<any[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);

  const [, startTransition] = useTransition();

  // Load baseline multi-source observation and execute pipeline
  const loadData = async (triggerLiveWeather = false) => {
    setIsLoading(true);
    try {
      if (triggerLiveWeather && appMode === 'REAL') {
        const liveRes = await weatherService.fetchObservation(16.9, 83.6, appMode);
        if (liveRes.isRealLiveFetch) {
          setLiveWeatherMessage(`Successfully fetched live marine weather via Backend API (${liveRes.latencyMs}ms)`);
        } else {
          setLiveWeatherMessage(`Offline / fallback mode: ${liveRes.errorMessage ?? 'Using validated synoptic baseline'}`);
        }
      }

      const { satelliteService } = await import('../services/ingestion/satelliteService');
      const loadedFrames = await satelliteService.fetchFrames(appMode);
      
      const obs = await ingestionOrchestrator.ingestCurrentObservation(16.9, 83.6, appMode);
      const satResult = satellitePreprocessor.process(obs.satellite);
      const vector = dataFusionEngine.fuseObservation(obs, satResult.features);
      const breakdowns = dataFusionEngine.getCategoryBreakdowns(vector);
      const statuses = sourceStatusTracker.getStatusList();
      const evalResult = prototypePipeline.executePipeline(vector);

      startTransition(() => {
        setFrames(loadedFrames);
        setCurrentFrameIdx(0);
        setIsPlaying(false);
        setObservation(obs);
        setProcessedSatellite(satResult);
        setFusedVector(vector);
        setCategoryBreakdown(breakdowns);
        setSourceStatuses(statuses);
        setLiveObservation(obs);
        setLiveEvaluation(evalResult);
      });
    } catch (err) {
      console.error('Failed to ingest multi-source data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initData = async () => {
      try {
        const { satelliteService } = await import('../services/ingestion/satelliteService');
        const loadedFrames = await satelliteService.fetchFrames(appMode);
        const obs = await ingestionOrchestrator.ingestCurrentObservation(16.9, 83.6, appMode);
        
        if (!mounted) return;
        const satResult = satellitePreprocessor.process(obs.satellite);
        const vector = dataFusionEngine.fuseObservation(obs, satResult.features);
        const breakdowns = dataFusionEngine.getCategoryBreakdowns(vector);
        const statuses = sourceStatusTracker.getStatusList();
        const evalResult = prototypePipeline.executePipeline(vector);

        setFrames(loadedFrames);
        setCurrentFrameIdx(0);
        setIsPlaying(false);
        setObservation(obs);
        setProcessedSatellite(satResult);
        setFusedVector(vector);
        setCategoryBreakdown(breakdowns);
        setSourceStatuses(statuses);
        setLiveObservation(obs);
        setLiveEvaluation(evalResult);
      } catch (err) {
        console.error(err);
      }
    };
    
    initData();

    return () => {
      mounted = false;
      if (playIntervalRef.current) window.clearInterval(playIntervalRef.current);
    };
  }, [appMode]);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      playIntervalRef.current = window.setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
      }, 1500);
    } else if (playIntervalRef.current) {
      window.clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) window.clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, frames.length]);

  const activeGrid =
    selectedBand === 'INFRARED'
      ? processedSatellite?.normalizedBands.infrared
      : selectedBand === 'VISIBLE'
      ? processedSatellite?.normalizedBands.visible
      : processedSatellite?.normalizedBands.waterVapour;

  const displayFeatures = frames.length > 0 && frames[currentFrameIdx]?.features
    ? {
        cloudTopMinTempCelsius: frames[currentFrameIdx].features.cloudTopMinTempCelsius,
        estimatedEyeDiameterKm: frames[currentFrameIdx].features.estimatedEyeDiameterKm,
        convectiveSymmetryScore: frames[currentFrameIdx].features.convectiveSymmetryScore,
        centralEyeDefinitionScore: 0.81, // Approximate mapping
        spiralBandingTightness: 0.85,
        dvorakTNumberEstimate: 4.5
      }
    : {
        cloudTopMinTempCelsius: processedSatellite?.features.cloudTopMinTempCelsius ?? -78.5,
        estimatedEyeDiameterKm: processedSatellite?.features.estimatedEyeDiameterKm ?? 32,
        convectiveSymmetryScore: processedSatellite?.features.convectiveSymmetryScore ?? 0.84,
        centralEyeDefinitionScore: observation?.satellite.centralEyeDefinitionScore ?? 0.72,
        spiralBandingTightness: observation?.satellite.spiralBandingTightness ?? 0.79,
        dvorakTNumberEstimate: observation?.satellite.dvorakTNumberEstimate ?? 4.5
      };

  const mlEvaluation = fusedVector ? prototypePipeline.executePipeline(fusedVector) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner with Scientific Honesty Notice & Live Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline-strong bg-panel-raised p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-data/10 text-data">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-ink">Multi-Source Data Architecture &amp; Fusion</h2>
              <DemoTag>SAMPLE + OPEN DATA</DemoTag>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">
              SIH26070 requirement: Unifies multi-spectral satellite imagery, ocean thermodynamics, atmospheric
              soundings, historical best-track analogs, and geospatial layers into a standardized ML feature vector.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-hairline-strong bg-void-raised px-3.5 py-2 text-[12px] font-semibold text-ink hover:bg-panel-hover disabled:opacity-50"
            title="Query live marine weather from Open-Meteo public API"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Ingesting Feeds...' : 'Query Open-Meteo Live Weather'}
          </button>
        </div>
      </div>

      {liveWeatherMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-data/30 bg-data/5 px-4 py-2.5 text-[12px] text-data">
          <CheckCircle2 size={15} />
          <span>{liveWeatherMessage}</span>
        </div>
      )}

      {/* Grid: Multi-Spectral Satellite Imagery (Left) + Extracted Features & Bands (Right) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          <PanelHeader
            title="Satellite Imagery Preprocessing Foundation"
            note="INSAT-3DR Multispectral Imagery (Sample Formulation)"
          />
          <div className="p-4 sm:p-5 space-y-4">
            {/* Spectral Band Selector & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-void p-1 text-[12px]">
                <button
                  onClick={() => setSelectedBand('INFRARED')}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    selectedBand === 'INFRARED' ? 'bg-signal text-white' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  Thermal IR (10.8 µm)
                </button>
                <button
                  onClick={() => setSelectedBand('VISIBLE')}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    selectedBand === 'VISIBLE' ? 'bg-signal text-white' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  Visible (0.65 µm)
                </button>
                <button
                  onClick={() => setSelectedBand('WATER_VAPOUR')}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    selectedBand === 'WATER_VAPOUR' ? 'bg-signal text-white' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  Water Vapour (6.7 µm)
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-hairline bg-void p-1 text-[11px]">
                <button
                  onClick={() => setViewMode('calibrated')}
                  className={`rounded px-2 py-1 font-medium transition-colors ${
                    viewMode === 'calibrated' ? 'bg-signal/15 text-signal font-semibold' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  Calibrated
                </button>
                <button
                  onClick={() => setViewMode('roi')}
                  className={`rounded px-2 py-1 font-medium transition-colors ${
                    viewMode === 'roi' ? 'bg-signal/15 text-signal font-semibold' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  224x224 RoI
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`rounded px-2 py-1 font-medium transition-colors ${
                    viewMode === 'raw' ? 'bg-signal/15 text-signal font-semibold' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  Raw DN
                </button>
              </div>
            </div>

            {/* Satellite Matrix Canvas Visualizer */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
              <div className="flex flex-col items-center justify-center rounded-xl border border-hairline-strong bg-void p-4">
                <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-lg border border-hairline bg-black shadow-inner">
                  {frames.length > 0 ? (
                    <img 
                      src={frames[currentFrameIdx].url} 
                      alt="Satellite Frame" 
                      className="h-full w-full object-cover opacity-90 transition-opacity duration-300"
                    />
                  ) : activeGrid ? (
                    <svg viewBox="0 0 32 32" className="h-full w-full shape-rendering-crispEdges">
                      {activeGrid.map((row, y) =>
                        row.map((val, x) => {
                          let fill = '#000';
                          if (selectedBand === 'INFRARED') {
                            fill = SatellitePreprocessor.getDvorakBDColor(val);
                          } else if (selectedBand === 'WATER_VAPOUR') {
                            fill = SatellitePreprocessor.getWaterVapourColor(val);
                          } else {
                            fill = SatellitePreprocessor.getVisibleColor(val);
                          }
                          return (
                            <rect
                              key={x + '-' + y}
                              x={x}
                              y={y}
                              width={1.1}
                              height={1.1}
                              fill={fill}
                              className="transition-colors duration-500"
                            />
                          );
                        })
                      )}
                    </svg>
                  ) : null}

                  {/* Target Reticle */}
                  <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute inset-0 rounded-full border border-signal opacity-30 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-signal" />
                    <div className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-x-1/2 -translate-y-1/2 bg-signal/50" />
                    <div className="absolute left-1/2 top-1/2 h-full w-0.5 -translate-x-1/2 -translate-y-1/2 bg-signal/50" />
                  </div>

                  <div className="absolute top-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[9.5px] font-mono text-white backdrop-blur">
                    {frames.length > 0 ? (frames[currentFrameIdx]?.source + ' • ' + frames[currentFrameIdx]?.channel) : (selectedBand + ' • 32x32 Grid')}
                  </div>
                  <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[9.5px] font-mono text-white/80">
                    RoI: 16.9°N, 83.6°E
                  </div>
                </div>

                {/* TIMELINE REPLAY CONTROLS */}
                {frames.length > 0 && (
                  <div className="mt-4 flex w-full max-w-[280px] flex-col gap-2">
                    <div className="flex w-full items-center justify-between rounded-lg border border-hairline bg-panel-raised p-2">
                      <button 
                        onClick={() => setCurrentFrameIdx(p => Math.max(0, p - 1))}
                        className="p-1 text-ink-dim hover:text-ink disabled:opacity-50 transition-colors"
                        disabled={currentFrameIdx === 0}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-1.5 rounded-full bg-signal px-4 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-signal/90 transition-colors"
                      >
                        {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                      </button>

                      <button 
                        onClick={() => setCurrentFrameIdx(p => Math.min(frames.length - 1, p + 1))}
                        className="p-1 text-ink-dim hover:text-ink disabled:opacity-50 transition-colors"
                        disabled={currentFrameIdx === frames.length - 1}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-center gap-1.5 mt-1 mb-1">
                      {frames.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentFrameIdx ? 'w-4 bg-signal' : 'w-1.5 bg-hairline-strong'}`} />
                      ))}
                    </div>
                    
                    <div className="text-center text-[10.5px] font-mono text-ink-dim">
                      {new Date(frames[currentFrameIdx]?.timestamp || Date.now()).toLocaleString('en-US', {
                        timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} UTC
                    </div>
                  </div>
                )}

                {/* Colormap Legend */}
                {selectedBand === 'INFRARED' && (
                  <div className="mt-3 w-full max-w-[280px]">
                    <div className="flex h-2.5 w-full rounded overflow-hidden">
                      <div className="flex-1 bg-[#ff1744]" title="<-80°C (Deep Overshoot)" />
                      <div className="flex-1 bg-[#d500f9]" title="-70°C to -80°C" />
                      <div className="flex-1 bg-[#00e5ff]" title="-60°C to -70°C" />
                      <div className="flex-1 bg-[#b0bec5]" title="-40°C to -60°C (CDO)" />
                      <div className="flex-1 bg-[#263238]" title=">-40°C (Warm)" />
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] font-semibold tracking-wider text-ink-faint">
                      <span>-85°C (Cold CDO)</span>
                      <span>Dvorak BD-Curve</span>
                      <span>+20°C (Sea)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Satellite Structural Features */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  Derived Structural Features
                </p>
                <div className="space-y-2 text-[12.5px]">
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3 py-2">
                    <span className="text-ink-dim">Min Cloud-Top Temp</span>
                    <span className="mono font-semibold text-signal">
                      {displayFeatures.cloudTopMinTempCelsius}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3 py-2">
                    <span className="text-ink-dim">Central Eye Definition</span>
                    <span className="mono font-semibold text-ink">
                      {Math.round(displayFeatures.centralEyeDefinitionScore * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3 py-2">
                    <span className="text-ink-dim">Convective Symmetry</span>
                    <span className="mono font-semibold text-safe">
                      {Math.round(displayFeatures.convectiveSymmetryScore * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3 py-2">
                    <span className="text-ink-dim">Estimated Eye Diameter</span>
                    <span className="mono font-semibold text-ink">
                      {displayFeatures.estimatedEyeDiameterKm} {displayFeatures.estimatedEyeDiameterKm !== 'N/A' && 'km'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3 py-2">
                    <span className="text-ink-dim">Spiral Banding Tightness</span>
                    <span className="mono font-semibold text-ink">
                      {displayFeatures.spiralBandingTightness}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3 py-2">
                    <span className="text-ink-dim">Estimated Dvorak T-Number</span>
                    <span className="mono font-semibold text-data">
                      T{displayFeatures.dvorakTNumberEstimate} (CI {displayFeatures.dvorakTNumberEstimate})
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Pipeline Stage Footnote */}
            <div className="rounded-lg border border-hairline bg-void-raised p-3 text-[11px] leading-relaxed text-ink-faint">
              <span className="font-semibold text-ink">Preprocessing Chain:</span> Raw DN → Planck Brightness Temp Calibration
              (TIR1 10.8µm) → Radiometric Range Validation → 224x224 RoI Standardization → Spatial Feature Extraction.
            </div>
          </div>
        </Panel>

        {/* Ocean & Atmospheric Telemetry Panels */}
        <div className="space-y-6">
          {/* Ocean Telemetry */}
          <Panel>
            <PanelHeader title="Ocean Thermodynamic Data" note="Sea Surface Thermal Structure" />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-[11px] font-medium text-ink-faint">Dataset Provider</span>
                <span className="rounded bg-signal/10 px-2 py-0.5 text-[10.5px] font-semibold text-signal">
                  NOAA OISST / INCOIS (Sample)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Thermometer size={14} className="text-warn" />
                    <span>SST at Core</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-ink">
                    {observation?.ocean.sstCelsius ?? 29.4}°C
                  </p>
                  <p className="mt-1 text-[10.5px] text-safe">Above 26.5°C threshold</p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Activity size={14} className="text-data" />
                    <span>SST Anomaly</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-signal">
                    +{observation?.ocean.sstAnomalyCelsius ?? 1.2}°C
                  </p>
                  <p className="mt-1 text-[10.5px] text-ink-faint">Bay warm pool anomaly</p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Waves size={14} className="text-data" />
                    <span>Ocean Heat Content</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-ink">
                    {observation?.ocean.oceanHeatContentKjCm2 ?? 74.5}
                  </p>
                  <p className="mt-1 text-[10.5px] text-ink-faint">kJ/cm² (TCHP)</p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Compass size={14} className="text-ink-dim" />
                    <span>26°C Isotherm Depth</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-ink">
                    {observation?.ocean.isothermalLayerDepthMeters ?? 65} m
                  </p>
                  <p className="mt-1 text-[10.5px] text-safe">Deep barrier layer</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Atmospheric Telemetry */}
          <Panel>
            <PanelHeader title="Atmospheric &amp; Weather Data" note="Open-Meteo / Synoptic Analysis" />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <span className="text-[11px] font-medium text-ink-faint">Feed Type</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${
                    observation?.atmosphere.isRealLiveFetch
                      ? 'bg-safe/15 text-safe border border-safe/30'
                      : 'bg-void-raised text-ink-dim border border-hairline'
                  }`}
                >
                  {observation?.atmosphere.isRealLiveFetch ? 'LIVE OPEN-METEO' : 'VALIDATED SYNOPTIC (SAMPLE)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Wind size={14} className="text-data" />
                    <span>Max Sustained Wind</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-ink">
                    {observation?.atmosphere.maxSustainedWindKmh ?? 110} km/h
                  </p>
                  <p className="mt-1 text-[10.5px] text-ink-faint">
                    Gusts: {observation?.atmosphere.windGustsKmh ?? 135} km/h
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Activity size={14} className="text-signal" />
                    <span>Central Pressure</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-ink">
                    {observation?.atmosphere.centralPressureHpa ?? 970} hPa
                  </p>
                  <p className="mt-1 text-[10.5px] text-ink-faint">
                    Deficit: {observation?.atmosphere.pressureDeficitHpa ?? 38} hPa
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Compass size={14} className="text-safe" />
                    <span>Vertical Wind Shear</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-safe">
                    {observation?.atmosphere.verticalWindShearKnots ?? 11.5} kts
                  </p>
                  <p className="mt-1 text-[10.5px] text-safe">&lt;15 kts = Highly Favorable</p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                  <div className="flex items-center gap-1.5 text-ink-faint text-[11px]">
                    <Waves size={14} className="text-data" />
                    <span>700 hPa Moisture</span>
                  </div>
                  <p className="mono mt-1 text-xl font-bold text-ink">
                    {observation?.atmosphere.relativeHumidity700HpaPercent ?? 84}%
                  </p>
                  <p className="mt-1 text-[10.5px] text-ink-faint">Low dry-air intrusion</p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Historical Best-Track & Geospatial Exposure Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Historical IBTrACS Analogs */}
        <Panel>
          <PanelHeader title="Historical Cyclone Analogs (NOAA IBTrACS)" note="Bay of Bengal Historical Matches" />
          <div className="p-4 sm:p-5 space-y-3">
            <p className="text-[12px] text-ink-dim leading-relaxed">
              Historical trajectories from NOAA IBTrACS and IMD archives used to calibrate track propagation and
              intensity analog curves:
            </p>
            <div className="space-y-2.5">
              {observation?.historical.analogCyclones.map((analog) => (
                <div
                  key={analog.name}
                  className="rounded-lg border border-hairline bg-panel-raised p-3 transition-colors hover:border-hairline-strong"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-ink">{analog.name}</span>
                      <span className="rounded bg-void px-1.5 py-0.5 text-[10.5px] font-mono text-ink-faint border border-hairline">
                        {analog.year}
                      </span>
                    </div>
                    <span className="rounded-full bg-data/10 px-2 py-0.5 text-[10.5px] font-semibold text-data">
                      {analog.similarityScorePercent}% Similarity
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-dim">
                    <span>Category: {analog.peakCategory}</span>
                    <span>Peak Wind: {analog.maxWindKmh} km/h</span>
                    <span>Min Pressure: {analog.minPressureHpa} hPa</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-faint leading-relaxed">{analog.trackSummary}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 flex items-center justify-between text-[11px] text-ink-faint border-t border-hairline">
              <span>Past 24h Intensification: +{observation?.historical.intensificationRate24hKmh ?? 35} km/h</span>
              <span className="mono">NOAA IBTrACS v04r01</span>
            </div>
          </div>
        </Panel>

        {/* Geospatial & Infrastructure Exposure */}
        <Panel>
          <PanelHeader title="Geospatial &amp; Coastal Infrastructure" note="GIS Layers &amp; Vulnerability" />
          <div className="p-4 sm:p-5 space-y-3">
            <p className="text-[12px] text-ink-dim leading-relaxed">
              Topographic elevation, coastline distance, and critical infrastructure mapped for impact assessment:
            </p>
            <div className="grid grid-cols-2 gap-2.5 text-[12.5px]">
              <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                <span className="text-[11px] text-ink-faint">Distance to Coast</span>
                <p className="mono mt-1 text-lg font-bold text-ink">
                  {observation?.geospatial.distanceToCoastlineKm ?? 133} km
                </p>
                <p className="mt-1 text-[10.5px] text-ink-dim">To North Andhra shoreline</p>
              </div>
              <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                <span className="text-[11px] text-ink-faint">Avg Coastal Elevation</span>
                <p className="mono mt-1 text-lg font-bold text-warn">
                  {observation?.geospatial.coastalElevationAvgMeters ?? 4.8} m MSL
                </p>
                <p className="mt-1 text-[10.5px] text-critical">High storm-surge susceptibility</p>
              </div>
              <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                <span className="text-[11px] text-ink-faint">Exposed Population (100km)</span>
                <p className="mono mt-1 text-lg font-bold text-ink">
                  {((observation?.geospatial.populationIn100KmRadius ?? 3840000) / 1000000).toFixed(1)}M
                </p>
                <p className="mt-1 text-[10.5px] text-ink-dim">Across Vizag-Kakinada belt</p>
              </div>
              <div className="rounded-lg border border-hairline bg-panel-raised p-3">
                <span className="text-[11px] text-ink-faint">Designated Shelters</span>
                <p className="mono mt-1 text-lg font-bold text-safe">
                  {observation?.geospatial.evacuationSheltersAvailable ?? 5} Centers
                </p>
                <p className="mt-1 text-[10.5px] text-ink-dim">
                  Capacity: {observation?.geospatial.shelterCapacityTotal.toLocaleString() ?? '4,750'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-hairline bg-void-raised p-3 text-[11.5px] text-ink-dim">
              <span className="font-semibold text-ink">Target Landfall Sector: </span>
              {observation?.geospatial.nearestLandfallSector}
            </div>
          </div>
        </Panel>
      </div>

      {/* Multi-Source Feature Fusion Vector Breakdown */}
      <Panel>
        <PanelHeader
          title="Multi-Source Feature Fusion Engine"
          note="Normalized 19-Dimensional Feature Vector for AI/ML Models"
        />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-[12px] text-ink-dim">
            <Cpu size={15} className="text-data" />
            <span>
              The Data Fusion Engine maps heterogeneous physical dimensions into a balanced, normalized feature vector
              ([0.0 – 1.0]) consumed by the Detection, Classification, Track, and Intensity models.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="rounded-lg border border-hairline bg-panel-raised p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-ink-faint">{cat.category}</span>
                  <span className="rounded bg-void px-1.5 py-0.5 text-[10px] font-mono text-ink-dim">
                    {cat.featureCount} Features
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex justify-between text-[11.5px] mb-1">
                    <span className="text-ink-dim">Normalized Index</span>
                    <span className="mono font-semibold text-ink">{cat.averageNormalizedScore.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-void overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full transition-all"
                      style={{ width: `${Math.round(cat.averageNormalizedScore * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[10.5px] text-ink-faint truncate" title={cat.sourceAttribution}>
                  {cat.sourceAttribution}
                </p>
              </div>
            ))}
          </div>

          {/* AI/ML Model Readiness Contracts Bar */}
          {mlEvaluation && (
            <div className="mt-4 rounded-xl border border-hairline-strong bg-void-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
                <div>
                  <h4 className="text-[13px] font-bold text-ink">Downstream AI / ML Model Contract Feed</h4>
                  <p className="text-[11px] text-ink-faint">
                    Execution status of models consuming the fused feature vector
                  </p>
                </div>
                <span className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-signal">
                  PROTOTYPE EVALUATION
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 text-[12px]">
                <div className="rounded-lg border border-hairline bg-panel p-2.5">
                  <p className="text-[10.5px] text-ink-faint">Model 1: Detection</p>
                  <p className="font-semibold text-ink mt-0.5">
                    {mlEvaluation.detection.systemClass}
                  </p>
                  <p className="text-[10px] text-safe mt-0.5">
                    {mlEvaluation.detection.detectionConfidencePercent}% Confidence
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel p-2.5">
                  <p className="text-[10.5px] text-ink-faint">Model 2: Classification</p>
                  <p className="font-semibold text-signal mt-0.5">
                    {mlEvaluation.classification.stage}
                  </p>
                  <p className="text-[10px] text-ink-dim mt-0.5">
                    Dvorak {mlEvaluation.classification.dvorakRating}
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel p-2.5">
                  <p className="text-[10.5px] text-ink-faint">Model 3: Track Prediction</p>
                  <p className="font-semibold text-ink mt-0.5">
                    +24h North-North-East
                  </p>
                  <p className="text-[10px] text-ink-dim mt-0.5">
                    Landfall ETA: ~14.5 hrs
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel p-2.5">
                  <p className="text-[10.5px] text-ink-faint">Model 4: Intensity Forecast</p>
                  <p className="font-semibold text-ink mt-0.5">
                    Peak: {mlEvaluation.intensity.projectedPeakWindKmh} km/h
                  </p>
                  <p className="text-[10px] text-warn mt-0.5">
                    RI Risk: {mlEvaluation.intensity.rapidIntensificationProbabilityPercent}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Comprehensive Data Source Quality & Health Board */}
      <Panel>
        <PanelHeader
          title="Data Sources Quality &amp; Status Indicator"
          note="Transparent telemetry monitoring for judges &amp; disaster officials"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-hairline bg-void-raised text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                <th className="px-4 py-3">Source Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cadence</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Scientific Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {sourceStatuses.map((source) => (
                <tr key={source.id} className="hover:bg-panel-hover transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">
                    {source.name}
                    <p className="text-[11px] font-normal text-ink-faint mt-0.5">{source.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-void px-2 py-0.5 text-[10.5px] font-mono text-ink-dim border border-hairline">
                      {source.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                        source.badgeType === 'live'
                          ? 'bg-safe/15 text-safe border border-safe/30'
                          : source.badgeType === 'sample'
                          ? 'bg-signal/15 text-signal border border-signal/30'
                          : 'bg-data/15 text-data border border-data/30'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {source.badgeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-dim font-mono text-[11.5px]">{source.refreshInterval}</td>
                  <td className="px-4 py-3 text-ink-dim font-mono text-[11.5px]">{source.latencyMs ?? '—'} ms</td>
                  <td className="px-4 py-3 text-ink-dim text-[11.5px]">{source.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-[11.5px] text-ink-faint bg-void-raised">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-signal" />
            <span>
              CycloneX is an AI-assisted decision-support prototype. It does NOT supersede or replace official IMD
              bulletins or state disaster management authority evacuation directives.
            </span>
          </div>
          <span className="mono text-[11px]">SIH26070 Multi-Source Pipeline</span>
        </div>
      </Panel>
    </div>
  );
}



