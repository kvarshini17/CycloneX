import { cycloneProfile } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import { StatCard } from './ui';
import { Activity, AlertCircle } from 'lucide-react';

export function StatusCards() {
  const { result, isModified, aiData, aiStatus, appMode, activeCyclones, realAnalysis } = useSimulation();

  // Mode-aware values
  const isReal = appMode === 'REAL';
  const realMatched = realAnalysis?.matched_cyclone;
  
  const statusLabel = isReal
    ? (realMatched ? 'ACTIVE' : activeCyclones.length > 0 ? `${activeCyclones.length} ACTIVE` : 'NONE')
    : 'ACTIVE';
  const statusSub = isReal
    ? (realMatched ? realMatched.name : activeCyclones.length > 0 ? 'Monitored Basins' : 'No active storm')
    : cycloneProfile.name;

  const classificationValue = isReal
    ? (realMatched ? realMatched.classification : (realAnalysis?.cyclone_status ? 'Environmental Analysis' : 'Monitoring'))
    : result.stage;
  const classificationSub = isReal
    ? (realMatched ? `Source: ${realMatched.source.split(' ')[0]}` : 'Global Satellite Scan')
    : (isModified ? 'Simulated scenario' : 'Category: Severe');

  const windValue = isReal
    ? (realAnalysis?.environment?.wind_kmh != null ? `${realAnalysis.environment.wind_kmh} km/h` : '--')
    : `${result.windKmh} km/h`;
  const windSub = isReal ? 'Live Open-Meteo' : 'Sustained, 3-min avg';

  const pressureValue = isReal
    ? (realAnalysis?.environment?.pressure_hpa != null ? `${realAnalysis.environment.pressure_hpa} hPa` : '--')
    : `${result.pressureHpa} hPa`;
  const pressureSub = isReal ? 'Observed Sea-Level' : 'Falling gradually';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {/* 1. Cyclone Status */}
      <StatCard label="Cyclone Status" value={statusLabel} tone={isReal && !realMatched ? 'default' : 'signal'} sub={statusSub} />
      
      {/* 2. Classification */}
      <StatCard label="Classification" value={classificationValue} tone="default" sub={classificationSub} />
      
      {/* 3. Current Wind */}
      <StatCard label="Current Wind" value={windValue} tone="warn" sub={windSub} />
      
      {/* 4. Central Pressure */}
      <StatCard label="Central Pressure" value={pressureValue} tone="data" sub={pressureSub} />
      
      {/* 5. AI Predicted Wind */}
      <div className="rounded-xl border border-hairline bg-panel-raised p-4 flex flex-col justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-dim flex items-center gap-1.5"><Activity size={12} className="text-data"/> AI Predict Wind</p>
        <p className="font-mono text-xl font-bold text-ink mt-2">
          {aiStatus === 'ONLINE' && aiData ? `${aiData.wind.toFixed(1)} km/h` : '--'}
        </p>
        <p className="text-[10px] text-ink-faint mt-1">SIH26070 Output</p>
      </div>

      {/* 6. AI Predicted Pressure */}
      <div className="rounded-xl border border-hairline bg-panel-raised p-4 flex flex-col justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-dim flex items-center gap-1.5"><Activity size={12} className="text-data"/> AI Predict Pres</p>
        <p className="font-mono text-xl font-bold text-ink mt-2">
          {aiStatus === 'ONLINE' && aiData ? `${aiData.pressure.toFixed(1)} hPa` : '--'}
        </p>
        <p className="text-[10px] text-ink-faint mt-1">SIH26070 Output</p>
      </div>

      {/* 7. AI Movement */}
      <div className="rounded-xl border border-hairline bg-panel-raised p-4 flex flex-col justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-dim flex items-center gap-1.5"><Activity size={12} className="text-data"/> AI Movement</p>
        <p className="font-mono text-[13px] font-bold text-ink mt-2 leading-tight">
          {aiStatus === 'ONLINE' && aiData ? `ΔLat: ${aiData.delta_lat.toFixed(2)}°\nΔLng: ${aiData.delta_lon.toFixed(2)}°` : '--'}
        </p>
        <p className="text-[10px] text-ink-faint mt-1">One-Step Δ</p>
      </div>

      {/* 8. Model Status */}
      <div className="rounded-xl border border-hairline bg-panel-raised p-4 flex flex-col justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-dim">Model Status</p>
        <div className="mt-2 flex items-center gap-2">
          {aiStatus === 'ONLINE' ? (
            <span className="flex items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2 py-0.5 text-[10px] font-semibold text-safe">
              <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" />
              ONLINE
            </span>
          ) : aiStatus === 'LOADING' ? (
            <span className="flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[10px] font-semibold text-warn">
              LOADING...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-critical/30 bg-critical/10 px-2 py-0.5 text-[10px] font-semibold text-critical">
              <AlertCircle size={10} />
              OFFLINE
            </span>
          )}
        </div>
        <p className="text-[10px] text-ink-faint mt-1">PyTorch Model</p>
      </div>
    </div>
  );
}


