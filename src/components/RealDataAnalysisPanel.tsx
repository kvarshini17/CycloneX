import { AlertCircle, AlertTriangle, CheckCircle2, Compass, Cpu, Globe2, MapPin, RefreshCw, Shield, Thermometer, Waves, Wind } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader } from './ui';

export function RealDataAnalysisPanel() {
  const {
    selectedLocation,
    realAnalysis,
    isAnalyzing,
    activeCyclones,
    analyzeLocation,
    refreshActiveCyclones,
  } = useSimulation();

  const env = realAnalysis?.environment;
  const model = realAnalysis?.model;
  const impacts = realAnalysis?.impacts || [];
  const preparedness = realAnalysis?.preparedness || [];

  return (
    <Panel>
      <PanelHeader
        title="Real-Time Global Cyclone Intelligence"
        note={isAnalyzing ? 'Ingesting authoritative feeds...' : 'Live NOAA NHC · GDACS · Copernicus · Open-Meteo · PyTorch ML'}
      />
      <div className="p-4 space-y-4 max-h-[820px] overflow-y-auto">

        {/* 1. GLOBAL CYCLONE MONITOR */}
        <div className="rounded-lg border border-hairline bg-void-raised p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 size={16} className="text-signal animate-pulse" />
              <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
                Global Cyclone Monitor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-safe/10 border border-safe/30 px-2 py-0.5 text-[10.5px] font-semibold text-safe">
                {activeCyclones.length} Active System{activeCyclones.length === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => refreshActiveCyclones()}
                className="rounded p-1 text-ink-dim hover:bg-panel-hover hover:text-ink transition-colors"
                title="Refresh active storms"
              >
                <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {activeCyclones.length > 0 ? (
            <div className="mt-2.5 space-y-1.5">
              {activeCyclones.map((storm) => (
                <div
                  key={storm.id}
                  onClick={() => analyzeLocation(storm.latitude, storm.longitude)}
                  className="flex items-center justify-between rounded-md border border-hairline bg-panel p-2 text-[11px] cursor-pointer hover:border-signal/50 transition-colors"
                  title="Click to center map & analyze this system"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-signal" />
                    <span className="font-bold text-ink">{storm.name}</span>
                    <span className="text-ink-dim">({storm.classification})</span>
                  </div>
                  <div className="flex items-center gap-3 mono text-ink-dim">
                    <span>{storm.windKmh ? `${storm.windKmh} km/h` : 'N/A'}</span>
                    <span>{storm.latitude.toFixed(1)}°, {storm.longitude.toFixed(1)}°</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-ink-faint">
              NO ACTIVE CYCLONE DETECTED IN AVAILABLE DATA
            </p>
          )}
          <p className="mt-2 text-[10px] text-ink-faint flex items-center justify-between border-t border-hairline pt-1.5">
            <span>Authoritative Source: NOAA NHC &amp; GDACS</span>
            <span className="mono">{realAnalysis?.timestamp ? new Date(realAnalysis.timestamp).toLocaleTimeString() : 'Current'}</span>
          </p>
        </div>

        {/* 2. SELECTED LOCATION & INSTRUCTION */}
        <div className="rounded-lg border border-hairline bg-panel-raised p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink uppercase">
              <MapPin size={13} className="text-data" />
              <span>Selected Coordinates</span>
            </div>
            {isAnalyzing && (
              <span className="flex items-center gap-1 text-[10.5px] font-mono text-signal animate-pulse">
                <RefreshCw size={10} className="animate-spin" /> Ingesting Point Data...
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <p className="mono text-base font-bold text-ink">
              {selectedLocation ? `${selectedLocation.lat.toFixed(2)}°N, ${selectedLocation.lng.toFixed(2)}°E` : 'Click anywhere on map'}
            </p>
            <span className="text-[10px] text-ink-faint">
              Leaflet Click-to-Analyze
            </span>
          </div>
          <p className="mt-1 text-[10.5px] text-ink-dim leading-relaxed">
            Click any oceanic or coastal point on the interactive 2D map to inspect live environmental conditions, active system proximity, and PyTorch model predictions.
          </p>
        </div>

        {/* 3. ENVIRONMENT (Live Observed Telemetry) */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">
            Environmental Telemetry
          </p>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {/* SST */}
            <div className="rounded-lg border border-hairline bg-panel-raised p-2.5">
              <div className="flex items-center justify-between text-[10.5px] text-ink-faint">
                <span className="flex items-center gap-1"><Thermometer size={12} className="text-warn"/> Ocean SST</span>
                <span className={`mono rounded px-1.5 py-0.2 text-[9.5px] font-semibold ${
                  env?.sst_status === 'LIVE' ? 'bg-safe/10 text-safe border border-safe/30' : 'bg-void text-ink-dim border border-hairline'
                }`}>
                  {env?.sst_status === 'LIVE' ? 'LIVE COPERNICUS' : (env?.sst_status || 'OFFLINE')}
                </span>
              </div>
              <p className="mono mt-1 text-lg font-bold text-ink">
                {env?.sst_c != null ? `${env.sst_c}°C` : '--'}
              </p>
              <p className="text-[9.5px] text-ink-faint truncate mt-0.5" title={env?.sst_source}>
                {env?.sst_source || 'METOFFICE-GLO-SST-L4'}
              </p>
            </div>

            {/* Surface Wind */}
            <div className="rounded-lg border border-hairline bg-panel-raised p-2.5">
              <div className="flex items-center justify-between text-[10.5px] text-ink-faint">
                <span className="flex items-center gap-1"><Wind size={12} className="text-data"/> Wind Speed</span>
                <span className={`mono rounded px-1.5 py-0.2 text-[9.5px] font-semibold ${
                  env?.weather_status === 'LIVE' ? 'bg-safe/10 text-safe border border-safe/30' : 'bg-void text-ink-dim border border-hairline'
                }`}>
                  {env?.weather_status === 'LIVE' ? 'LIVE OPEN-METEO' : 'OFFLINE'}
                </span>
              </div>
              <p className="mono mt-1 text-lg font-bold text-ink">
                {env?.wind_kmh != null ? `${env.wind_kmh} km/h` : '--'}
              </p>
              <p className="text-[9.5px] text-ink-faint mt-0.5">
                Sustained 10m wind
              </p>
            </div>

            {/* Surface Pressure */}
            <div className="rounded-lg border border-hairline bg-panel-raised p-2.5">
              <span className="flex items-center gap-1 text-[10.5px] text-ink-faint"><Compass size={12} className="text-signal"/> Surface Pressure</span>
              <p className="mono mt-1 text-lg font-bold text-ink">
                {env?.pressure_hpa != null ? `${env.pressure_hpa} hPa` : '--'}
              </p>
              <p className="text-[9.5px] text-ink-faint mt-0.5">
                Ambient sea-level
              </p>
            </div>

            {/* Temperature & Humidity */}
            <div className="rounded-lg border border-hairline bg-panel-raised p-2.5">
              <span className="flex items-center gap-1 text-[10.5px] text-ink-faint"><Waves size={12} className="text-safe"/> Temp / Humidity</span>
              <p className="mono mt-1 text-lg font-bold text-ink">
                {env?.temperature_c != null ? `${env.temperature_c}°C` : '--'} / {env?.humidity_pct != null ? `${env.humidity_pct}%` : '--'}
              </p>
              <p className="text-[9.5px] text-ink-faint mt-0.5">
                Precip: {env?.precipitation_mm != null ? `${env.precipitation_mm} mm` : '0 mm'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. CYCLONE ANALYSIS */}
        <div className="rounded-lg border border-hairline bg-panel-raised p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-1.5">
            Cyclone Status &amp; Proximity
          </p>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${
              realAnalysis?.matched_cyclone ? 'bg-critical animate-ping' : env?.sst_c && env.sst_c >= 26.5 ? 'bg-warn' : 'bg-safe'
            }`} />
            <span className="text-[13px] font-bold text-ink">
              {realAnalysis?.cyclone_status || 'NO ACTIVE SYSTEM DETECTED'}
            </span>
          </div>
          {realAnalysis?.closest_cyclone_distance_km != null && (
            <p className="mt-1 text-[11px] text-ink-dim">
              Closest monitored cyclone: <span className="mono font-semibold text-ink">{realAnalysis.closest_cyclone_distance_km} km</span>
            </p>
          )}
        </div>

        {/* 5. AI ASSISTED ANALYSIS (Actual PyTorch Model Output) */}
        <div className="rounded-lg border border-hairline bg-panel-raised p-3">
          <div className="flex items-center justify-between border-b border-hairline pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu size={14} className="text-signal" />
              <span className="text-[11px] font-bold text-ink uppercase">AI-Assisted Analysis</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              model?.status === 'ONLINE' ? 'bg-safe/10 text-safe border border-safe/30' : 'bg-void text-ink-dim border border-hairline'
            }`}>
              MODEL {model?.status || 'OFFLINE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div>
              <span className="text-ink-faint text-[10px]">Predicted Wind:</span>
              <p className="mono font-bold text-ink text-[13px]">
                {model?.prediction?.predicted_wind_kmh != null ? `${model.prediction.predicted_wind_kmh.toFixed(1)} km/h` : '--'}
              </p>
            </div>
            <div>
              <span className="text-ink-faint text-[10px]">Predicted Pressure:</span>
              <p className="mono font-bold text-ink text-[13px]">
                {model?.prediction?.predicted_pressure_hpa != null ? `${model.prediction.predicted_pressure_hpa.toFixed(1)} hPa` : '--'}
              </p>
            </div>
            <div>
              <span className="text-ink-faint text-[10px]">One-Step Displacement:</span>
              <p className="mono font-bold text-ink text-[12px]">
                {model?.prediction?.delta_lat != null ? `ΔLat: ${model.prediction.delta_lat.toFixed(2)}°, ΔLng: ${model.prediction.delta_lon.toFixed(2)}°` : '--'}
              </p>
            </div>
            <div>
              <span className="text-ink-faint text-[10px]">Inference Latency:</span>
              <p className="mono font-bold text-safe text-[12px]">
                {model?.inference_time_ms != null ? `${model.inference_time_ms} ms` : '--'}
              </p>
            </div>
          </div>

          <div className="mt-2.5 rounded bg-void p-2 border border-hairline text-[10px] text-ink-faint leading-relaxed">
            <span className="font-semibold text-ink-dim">Input Modality:</span> Real coordinates &amp; weather sequence + {model?.satellite_input || 'SAMPLE SATELLITE TENSOR'}. One-step trajectory inference.
          </div>
        </div>

        {/* 6. POTENTIAL IMPACTS */}
        <div className="rounded-lg border border-hairline bg-panel-raised p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-warn" />
            Potential Environmental Impacts
          </p>

          {impacts.length > 0 ? (
            <div className="space-y-1.5">
              {impacts.map((imp, idx) => (
                <div key={idx} className="rounded border border-warn/30 bg-warn/5 p-2 text-[11px]">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>{imp.category}</span>
                    <span className="text-warn uppercase text-[10px]">{imp.severity}</span>
                  </div>
                  <p className="mt-0.5 text-ink-dim text-[10.5px] leading-relaxed">{imp.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-safe flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              No severe wind or precipitation impact thresholds breached at this coordinate.
            </p>
          )}

          {/* Exposure Data Honesty Note */}
          <div className="mt-2 border-t border-hairline pt-1.5 text-[10px] text-ink-faint flex justify-between">
            <span>Population &amp; Infrastructure:</span>
            <span className="mono text-ink-dim font-medium">DATA UNAVAILABLE (Global Mode)</span>
          </div>
        </div>

        {/* 7. DECISION-SUPPORT PREPAREDNESS */}
        <div className="rounded-lg border border-hairline bg-panel-raised p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2 flex items-center gap-1.5">
            <Shield size={13} className="text-safe" />
            Preparedness Recommendations
          </p>

          <ul className="space-y-1 text-[11px] text-ink-dim list-disc list-inside">
            {preparedness.map((p, idx) => (
              <li key={idx} className="leading-relaxed">{p}</li>
            ))}
          </ul>

          <div className="mt-3 rounded border border-signal/20 bg-signal/5 p-2 text-[10.5px] text-ink-dim flex items-start gap-2">
            <AlertCircle size={14} className="text-signal shrink-0 mt-0.5" />
            <span>
              <strong>Mandatory Protocol:</strong> {realAnalysis?.disclaimer || 'AI-assisted decision support. Follow official government warnings and advisories.'}
            </span>
          </div>
        </div>

      </div>
    </Panel>
  );
}
