import { AlertTriangle, Truck, Building, Hospital, Users, Signal } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { Panel, PanelHeader } from './ui';
import type { RiskLevel } from '../types';

function computeAiRisk(windKmh: number): RiskLevel {
  if (windKmh > 110) return 'HIGH';
  if (windKmh > 70) return 'MEDIUM';
  return 'LOW';
}

function getPriorityText(risk: RiskLevel) {
  if (risk === 'HIGH') return 'URGENT: Immediate Action Required';
  if (risk === 'MEDIUM') return 'ELEVATED: Prepare for Deployment';
  return 'STANDARD: Monitor Situation';
}

export function AIDisasterCommander({ compact: _compact = false }: { compact?: boolean }) {
  const { result, isModified, appMode, aiData } = useSimulation();
  
  // Use real AI data if available, otherwise fallback to simulated result
  const windSource = (appMode === 'REAL' && aiData) ? aiData.wind : result.windKmh;
  const threatLevel = computeAiRisk(windSource);
  
  const popVal = appMode === 'REAL' ? 'DATA UNAVAILABLE' : `${result.affectedPopulationM}M`;
  const hospVal = appMode === 'REAL' ? 'DATA UNAVAILABLE' : `${result.hospitals.filter((h) => h.priority !== 'Monitor').length} at-risk`;
  const commVal = appMode === 'REAL' ? 'DATA UNAVAILABLE' : `${result.commZones.reduce((acc, z) => acc + z.towersAffected, 0)} towers`;
  
  const infraRisk = computeAiRisk(windSource + 10);
  const evacRisk = computeAiRisk(windSource + 20);

  return (
    <Panel>
      <PanelHeader
        title="AI Disaster Commander"
        note={isModified ? `Scenario: ${result.emergencyPriority}` : (appMode === 'REAL' ? 'Live SIH26070 Output' : 'Demo data')}
      />
      <div className="p-4">
        
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-void-raised rounded-lg border border-hairline p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-dim uppercase mb-1"><AlertTriangle size={12}/> Threat Level</div>
            <div className={`font-mono text-sm font-bold ${threatLevel === 'HIGH' ? 'text-critical' : threatLevel === 'MEDIUM' ? 'text-warn' : 'text-safe'}`}>{threatLevel}</div>
          </div>
          <div className="bg-void-raised rounded-lg border border-hairline p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-dim uppercase mb-1"><Users size={12}/> Affected Pop.</div>
            <div className={`font-mono text-sm font-bold ${appMode === 'REAL' ? 'text-ink-faint' : 'text-ink'}`}>{popVal}</div>
          </div>
          <div className="bg-void-raised rounded-lg border border-hairline p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-dim uppercase mb-1"><Hospital size={12}/> Hospitals</div>
            <div className={`font-mono text-sm font-bold ${appMode === 'REAL' ? 'text-ink-faint' : 'text-ink'}`}>{hospVal}</div>
          </div>
          <div className="bg-void-raised rounded-lg border border-hairline p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-dim uppercase mb-1"><Signal size={12}/> Comm Risk</div>
            <div className={`font-mono text-sm font-bold ${appMode === 'REAL' ? 'text-ink-faint' : 'text-ink'}`}>{commVal}</div>
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-3">Top AI Priorities</h3>
        
        <div className="space-y-3">
          <div className="flex gap-3 rounded-lg border border-hairline bg-panel-raised p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-signal/10 text-signal"><Truck size={16} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="mono rounded bg-void px-1.5 py-0.5 text-[10.5px] font-semibold text-signal">P1</span>
                <p className="text-[13.5px] font-medium text-ink">Evacuation Priority</p>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-dim">Based on {windSource.toFixed(1)} km/h wind projection: {getPriorityText(evacRisk)}</p>
            </div>
          </div>
          
          <div className="flex gap-3 rounded-lg border border-hairline bg-panel-raised p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-signal/10 text-signal"><Building size={16} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="mono rounded bg-void px-1.5 py-0.5 text-[10.5px] font-semibold text-signal">P2</span>
                <p className="text-[13.5px] font-medium text-ink">Critical Infrastructure</p>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-dim">Based on physical damage modeling: {getPriorityText(infraRisk)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/5 px-3.5 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-[11.5px] leading-relaxed text-warn/90 font-medium">
            AI-assisted decision support — NOT an official government warning.
          </p>
        </div>
      </div>
    </Panel>
  );
}
