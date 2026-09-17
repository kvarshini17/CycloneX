import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader, riskDotColor } from './ui';
import { AlertCircle } from 'lucide-react';

export function CommunicationRisk() {
  const { result, isModified, appMode } = useSimulation();
  const maxTowers = Math.max(...result.commZones.map((z) => z.towersAffected), 1);

  return (
    <Panel>
      <PanelHeader title="Communication Risk" note={isModified ? 'Reflecting simulated scenario' : (appMode === 'REAL' ? 'Live Telemetry' : 'Prototype estimation')} />
      {appMode === 'REAL' ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-void-raised h-full min-h-[200px]">
          <AlertCircle size={32} className="text-ink-faint mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-ink-dim uppercase tracking-widest mb-1">DATA UNAVAILABLE</h3>
          <p className="text-xs text-ink-faint max-w-sm">
            Live local telecom cell-tower infrastructure data is not available in the current real-time environment.
          </p>
        </div>
      ) : (
      <div className="space-y-3 p-4">
        {result.commZones.map((zone) => (
          <div key={zone.zone}>
            <div className="mb-1 flex items-center justify-between text-[12.5px]">
              <span className="text-ink-dim">{zone.zone}</span>
              <span className="mono text-ink-faint">{zone.towersAffected} towers</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-void-raised">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${(zone.towersAffected / maxTowers) * 100}%`,
                  background: riskDotColor(zone.risk),
                }}
              />
            </div>
          </div>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-ink-faint">
          Prototype estimation based on simulated infrastructure data — not a real telecom outage prediction.
        </p>
      </div>
      )}
    </Panel>
  );
}
