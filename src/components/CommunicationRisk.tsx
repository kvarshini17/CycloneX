import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader, riskDotColor } from './ui';

export function CommunicationRisk() {
  const { result, isModified } = useSimulation();
  const maxTowers = Math.max(...result.commZones.map((z) => z.towersAffected), 1);

  return (
    <Panel>
      <PanelHeader title="Communication Risk" note={isModified ? 'Reflecting simulated scenario' : 'Prototype estimation'} />
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
          Prototype estimation based on simulated infrastructure data — not a real telecom outage
          prediction.
        </p>
      </div>
    </Panel>
  );
}
