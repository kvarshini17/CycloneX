import { riskAssessment as baseRiskAssessment } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader, RiskPill } from './ui';
import type { RiskLevel } from '../types';

const priorityTone: Record<string, string> = {
  STANDARD: 'text-safe',
  ELEVATED: 'text-data',
  HIGH: 'text-warn',
  CRITICAL: 'text-critical',
};

// Simple heuristic derived from AI wind output
function computeAiRisk(windKmh: number): RiskLevel {
  if (windKmh > 110) return 'HIGH';
  if (windKmh > 70) return 'MEDIUM';
  return 'LOW';
}

export function RiskAssessmentPanel() {
  const { result, isModified, appMode, aiData } = useSimulation();

  // If in real mode and AI data is available, derive physical risks from AI prediction
  const windRisk = (appMode === 'REAL' && aiData) ? computeAiRisk(aiData.wind) : result.windRisk;
  const surgeRisk = (appMode === 'REAL' && aiData) ? computeAiRisk(aiData.wind - 20) : result.stormSurgeRisk;
  const floodRisk = (appMode === 'REAL' && aiData) ? computeAiRisk(aiData.wind - 30) : result.floodRisk;
  const infraRisk = (appMode === 'REAL' && aiData) ? computeAiRisk(aiData.wind + 10) : result.infrastructureRisk;

  const rows = [
    { label: 'Flood Risk (Derived)', level: floodRisk },
    { label: 'Wind Risk (Derived)', level: windRisk },
    { label: 'Storm Surge Risk (Derived)', level: surgeRisk },
    { label: 'Infrastructure Risk (Derived)', level: infraRisk },
  ];

  const hospitalsRequiringPrep = result.hospitals.filter((h) => h.priority !== 'Monitor').length;

  return (
    <Panel>
      <PanelHeader title="Localized Risk Assessment" note={isModified ? 'Simulated scenario' : (appMode === 'REAL' ? 'Driven by AI Pred' : 'Demo scoring model')} />
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
          <MiniStat 
            label="Affected Population" 
            value={appMode === 'REAL' ? 'N/A' : `${result.affectedPopulationM}M`} 
            muted={appMode === 'REAL'} 
          />
          <MiniStat 
            label="High-Risk Zones" 
            value={appMode === 'REAL' ? 'N/A' : String(result.highRiskZones)} 
            muted={appMode === 'REAL'} 
          />
          <MiniStat 
            label="Hospitals to Prep" 
            value={appMode === 'REAL' ? 'N/A' : String(hospitalsRequiringPrep)} 
            muted={appMode === 'REAL'} 
          />
          <MiniStat 
            label="Shelters Identified" 
            value={appMode === 'REAL' ? 'N/A' : String(baseRiskAssessment.sheltersIdentified)} 
            muted={appMode === 'REAL'} 
          />
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
          {appMode === 'REAL' ? 
            'Physical risk levels (Wind, Flood) are analytically derived from the live SIH26070 deep learning output. Demographic/infrastructure exposure data is marked N/A as no live telemetry is connected.' : 
            'Risk levels and affected-area figures are demo values illustrating the scoring interface - they are not scientifically validated.'}
          {isModified && ' Currently showing the What-If Simulator scenario - open the simulator to adjust or reset it.'}
        </p>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`rounded-lg border border-hairline px-3 py-3 text-center ${muted ? 'bg-void-raised/50 opacity-60' : 'bg-void-raised'}`}>
      <p className={`mono text-lg font-bold ${muted ? 'text-ink-faint' : 'text-ink'}`}>{value}</p>
      <p className="mt-0.5 text-[10.5px] text-ink-faint">{label}</p>
    </div>
  );
}
