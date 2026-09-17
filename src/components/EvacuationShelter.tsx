import { evacuationRoutes } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader, RiskPill } from './ui';
import { AlertCircle } from 'lucide-react';

export function EvacuationShelter() {
  const { appMode } = useSimulation();

  return (
    <Panel>
      <PanelHeader title="Evacuation & Shelter Routing" note={appMode === 'REAL' ? 'Live Telemetry' : 'Static demo data'} />
      {appMode === 'REAL' ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-void-raised h-full min-h-[200px]">
          <AlertCircle size={32} className="text-ink-faint mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-ink-dim uppercase tracking-widest mb-1">DATA UNAVAILABLE</h3>
          <p className="text-xs text-ink-faint max-w-sm">
            Live local shelter capacity and municipal evacuation telemetry feeds are not connected in the current real-time environment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline bg-panel-raised text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Priority Zone</th>
                <th className="px-4 py-2.5 font-medium">Recommended Shelter</th>
                <th className="px-4 py-2.5 font-medium">Distance</th>
                <th className="px-4 py-2.5 font-medium">Capacity</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {evacuationRoutes.map((r) => (
                <tr key={r.zone} className="border-b border-hairline last:border-0 hover:bg-panel-hover">
                  <td className="px-4 py-2.5 text-ink">{r.zone}</td>
                  <td className="px-4 py-2.5 text-ink-dim">{r.shelter}</td>
                  <td className="mono px-4 py-2.5 text-ink-dim">{r.distanceKm} km</td>
                  <td className="mono px-4 py-2.5 text-ink-dim">{r.capacity.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <RiskPill level={r.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
