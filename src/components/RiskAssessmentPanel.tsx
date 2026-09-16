import { riskAssessment as baseRiskAssessment } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader, RiskPill } from './ui';

const priorityTone: Record<string, string> = {
  STANDARD: 'text-safe',
  ELEVATED: 'text-data',
  HIGH: 'text-warn',
  CRITICAL: 'text-critical',
};

export function RiskAssessmentPanel() {
  const { result, isModified, appMode } = useSimulation();

  const rows = [
    { label: 'Flood Risk', level: result.floodRisk },
    { label: 'Wind Risk', level: result.windRisk },
    { label: 'Storm Surge Risk', level: result.stormSurgeRisk },
    { label: 'Infrastructure Risk', level: result.infrastructureRisk },
  ];

  const hospitalsRequiringPrep = result.hospitals.filter((h) => h.priority !== 'Monitor').length;

  return (
    <Panel>
      <PanelHeader title="Localized Risk Assessment" note={isModified ? 'Simulated scenario' : (appMode === 'REAL' ? 'Live ML Model' : 'Demo scoring model')} />
      <div className="p-4">
        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-critical/30 bg-critical/5 px-4 py-3">
            <div>
              <p className="text-[11px] text-ink-faint">Overall Risk</p>
              <p className="mono text-lg font-bold text-critical">{result.overallRisk}</p>
            </div>
            <RiskPill level={result.overallRisk} />
          </div>
          <div className="rounded-lg border border-hairline bg-panel-raised px-4 py-3">
            <p className="text-[11px] text-ink-faint">Risk Score</p>
            <p className="mono text-lg font-bold text-ink">{result.riskScore} / 100</p>
          </div>
          <div className="rounded-lg border border-hairline bg-panel-raised px-4 py-3">
            <p className="text-[11px] text-ink-faint">Emergency Priority</p>
            <p className={`mono text-lg font-bold ${priorityTone[result.emergencyPriority]}`}>{result.emergencyPriority}</p>
          </div>
        </div>

        <div className="mb-5 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-hairline bg-panel-raised px-3.5 py-2.5">
              <span className="text-[13px] text-ink-dim">{row.label}</span>
              <RiskPill level={row.level} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStat label="Affected Population" value={`${result.affectedPopulationM}M`} />
          <MiniStat label="High-Risk Zones" value={String(result.highRiskZones)} />
          <MiniStat label="Hospitals to Prep" value={String(hospitalsRequiringPrep)} />
          <MiniStat label="Shelters Identified" value={String(baseRiskAssessment.sheltersIdentified)} />
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
          {appMode === 'REAL' ? 'Risk levels and affected-area figures are driven by the live ML pipeline predictions' : 'Risk levels and affected-area figures are demo values illustrating the scoring interface'} — they
          are not scientifically validated risk assessments.
          {isModified && ' Currently showing the What-If Simulator scenario — open the simulator to adjust or reset it.'}
        </p>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-void-raised px-3 py-3 text-center">
      <p className="mono text-lg font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[10.5px] text-ink-faint">{label}</p>
    </div>
  );
}

