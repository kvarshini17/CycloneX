import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader, RiskPill } from './ui';

const priorityStyle: Record<string, string> = {
  Monitor: 'text-ink-dim',
  Prepare: 'text-warn',
  'High Priority': 'text-critical font-semibold',
};

export function HospitalPreparedness() {
  const { result, isModified } = useSimulation();

  return (
    <Panel>
      <PanelHeader
        title="Hospital Preparedness"
        note={isModified ? 'Reflecting simulated scenario' : 'Demo data · baseline'}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-hairline bg-panel-raised text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2.5 font-medium">Hospital</th>
              <th className="px-4 py-2.5 font-medium">Risk</th>
              <th className="px-4 py-2.5 font-medium">Accessibility</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody>
            {result.hospitals.map((h) => (
              <tr key={h.name} className="border-b border-hairline last:border-0 hover:bg-panel-hover">
                <td className="px-4 py-2.5 text-ink">{h.name}</td>
                <td className="px-4 py-2.5">
                  <RiskPill level={h.risk} />
                </td>
                <td className="px-4 py-2.5 text-ink-dim">{h.accessibility}</td>
                <td className={`px-4 py-2.5 ${priorityStyle[h.priority]}`}>{h.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
