import { AlertTriangle, ArrowUpRight, Radio as RadioIcon, ShieldAlert, Siren, Truck } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader } from './ui';

const CATEGORY_ICON: Record<string, typeof Siren> = {
  Evacuation: Siren,
  Medical: ShieldAlert,
  Communication: RadioIcon,
  Shelter: ArrowUpRight,
  Logistics: Truck,
};

export function AIDisasterCommander({ compact = false }: { compact?: boolean }) {
  const { result, isModified, appMode } = useSimulation();
  const list = compact ? result.recommendations.slice(0, 3) : result.recommendations;

  return (
    <Panel>
      <PanelHeader
        title="AI Disaster Commander"
        note={isModified ? `Scenario: ` : (appMode === 'REAL' ? 'Live LLM Inference (Simulated)' : 'Rule-based demo logic')}
      />
      <div className="p-4">
        <div className="space-y-3">
          {list.map((rec) => {
            const Icon = CATEGORY_ICON[rec.category] ?? Siren;
            return (
              <div
                key={rec.priority}
                className="flex gap-3 rounded-lg border border-hairline bg-panel-raised p-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-signal/10 text-signal">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono rounded bg-void px-1.5 py-0.5 text-[10.5px] font-semibold text-signal">
                      P{rec.priority}
                    </span>
                    <p className="text-[13.5px] font-medium text-ink">{rec.title}</p>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-dim">{rec.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/5 px-3.5 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-[11.5px] leading-relaxed text-ink-dim">
            Decision-support recommendations generated from predefined demo logic, {appMode === 'REAL' ? 'based on the live data LLM prompt' : 'not a live LLM'}.
            {isModified
              ? ` Currently reflecting the What-If scenario (Emergency Priority: ${result.emergencyPriority}).`
              : ''}{' '}
            Final decisions remain with authorized disaster-management officials.
          </p>
        </div>
      </div>
    </Panel>
  );
}

