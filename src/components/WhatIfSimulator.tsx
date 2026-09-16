import { RotateCcw } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { INTENSITY_RANGE, TRACK_SHIFT_RANGE, type EmergencyPriority } from '../utils/simulation';
import { Panel, PanelHeader, RiskPill } from './ui';
import type { RiskLevel } from '../types';

const priorityStyle: Record<EmergencyPriority, string> = {
  STANDARD: 'text-safe bg-safe/10 border-safe/30',
  ELEVATED: 'text-data bg-data/10 border-data/30',
  HIGH: 'text-warn bg-warn/10 border-warn/30',
  CRITICAL: 'text-critical bg-critical/10 border-critical/30',
};

const priorityColor: Record<EmergencyPriority, string> = {
  STANDARD: 'var(--color-safe)',
  ELEVATED: 'var(--color-data)',
  HIGH: 'var(--color-warn)',
  CRITICAL: 'var(--color-critical)',
};

function DeltaTag({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.05) return <span className="text-[11px] text-ink-faint">No change</span>;
  const positive = value > 0;
  return (
    <span className={`mono text-[11px] font-medium ${positive ? 'text-critical' : 'text-safe'}`}>
      {positive ? '+' : ''}
      {value.toFixed(value % 1 === 0 ? 0 : 1)}
      {suffix}
    </span>
  );
}

function overallHospitalRisk(risks: RiskLevel[]): RiskLevel {
  if (risks.includes('HIGH')) return 'HIGH';
  if (risks.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

// Schematic (not geographic) preview: shows the baseline track fixed against
// the coastline, and the simulated track visibly sliding and the storm
// circle visibly growing/shrinking as the sliders move.
function ScenarioPathPreview({
  intensity,
  trackShift,
  riskScore,
  emergencyPriority,
}: {
  intensity: number;
  trackShift: number;
  riskScore: number;
  emergencyPriority: EmergencyPriority;
}) {
  const shiftPx = (trackShift / 80) * 70; // +right => away from coast
  const radius = 8 + (intensity + 20) * 0.42; // -20%..+20% -> ~8..25px
  const color = priorityColor[emergencyPriority];

  const baselinePath = 'M 90,150 C 140,120 150,90 210,40';
  const baseX = 195;
  const baseY = 55;

  return (
    <div className="rounded-lg border border-hairline bg-void-raised p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Track &amp; Intensity Preview (schematic)
        </p>
        <span className="mono text-[10.5px] text-ink-faint">not to scale</span>
      </div>
      <svg viewBox="0 0 260 170" className="h-40 w-full">
        <line x1="55" y1="0" x2="55" y2="170" stroke="var(--color-hairline-strong)" strokeWidth="2" strokeDasharray="4 4" />
        <text x="10" y="14" fill="var(--color-ink-faint)" fontSize="9" fontFamily="var(--font-mono)">
          COAST
        </text>

        <path d={baselinePath} fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeDasharray="5 5" opacity={0.7} />
        <circle cx={baseX} cy={baseY} r={9} fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.5" />

        <g style={{ transition: 'transform 200ms ease' }} transform={`translate(${shiftPx}, 0)`}>
          <path d={baselinePath} fill="none" stroke={color} strokeWidth="2.5" />
          <circle
            cx={baseX}
            cy={baseY}
            r={radius}
            fill={color}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth="2"
            style={{ transition: 'r 200ms ease' }}
          />
          <circle cx={baseX} cy={baseY} r={3.5} fill={color} />
        </g>

        <text x="65" y="164" fill="var(--color-ink-faint)" fontSize="9" fontFamily="var(--font-mono)">
          baseline (grey) vs simulated (colored)
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] text-ink-dim">
        Simulated risk score <span className="mono font-semibold" style={{ color }}>{riskScore}</span>
      </p>
    </div>
  );
}

export function WhatIfSimulator() {
  const { inputs, result, baseline, isModified, setIntensity, setTrackShift, reset } = useSimulation();
  const { intensityDeltaPercent: intensity, trackShiftKm: trackShift } = inputs;

  const baselineHospitalRisk = overallHospitalRisk(baseline.hospitals.map((h) => h.risk));
  const simulatedHospitalRisk = overallHospitalRisk(result.hospitals.map((h) => h.risk));

  return (
    <Panel>
      <PanelHeader title="What-If Cyclone Simulator" note="Scenario simulation — not a physical weather model" />
      <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-medium text-ink">Intensity Adjustment</label>
              <span className="mono text-[13px] font-semibold text-data">
                {intensity > 0 ? '+' : ''}
                {intensity}%
              </span>
            </div>
            <input
              type="range"
              min={INTENSITY_RANGE[0]}
              max={INTENSITY_RANGE[1]}
              step={1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-[var(--color-data)]"
            />
            <div className="mt-1 flex justify-between text-[10.5px] text-ink-faint">
              <span>{INTENSITY_RANGE[0]}%</span>
              <span>Baseline</span>
              <span>+{INTENSITY_RANGE[1]}%</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-medium text-ink">Track Shift</label>
              <span className="mono text-[13px] font-semibold text-data">
                {trackShift === 0 ? 'On baseline track' : `${Math.abs(trackShift)} km ${trackShift < 0 ? 'toward coast' : 'away from coast'}`}
              </span>
            </div>
            <input
              type="range"
              min={TRACK_SHIFT_RANGE[0]}
              max={TRACK_SHIFT_RANGE[1]}
              step={10}
              value={trackShift}
              onChange={(e) => setTrackShift(Number(e.target.value))}
              className="w-full accent-[var(--color-data)]"
            />
            <div className="mt-1 flex justify-between text-[10.5px] text-ink-faint">
              <span>Left (toward coast)</span>
              <span>Right (away)</span>
            </div>
          </div>

          <ScenarioPathPreview
            intensity={intensity}
            trackShift={trackShift}
            riskScore={result.riskScore}
            emergencyPriority={result.emergencyPriority}
          />

          <button
            onClick={reset}
            disabled={!isModified}
            className="flex items-center gap-1.5 rounded-md border border-hairline-strong px-3 py-1.5 text-[12px] text-ink-dim hover:bg-panel-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={13} /> Reset to baseline
          </button>

          <p className="text-[11.5px] leading-relaxed text-ink-faint">
            Adjust intensity and track assumptions to see how the map, hospitals, communication risk,
            and the AI Disaster Commander all respond together. This is a simplified, transparent,
            fully deterministic scoring function built for demonstration — it does not model real
            cyclone physics.
          </p>
        </div>

        {/* Scenario comparison */}
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Scenario Comparison — Baseline vs What-If
          </p>
          <div className="overflow-hidden rounded-lg border border-hairline">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-panel-raised text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3.5 py-2.5 font-medium">Metric</th>
                  <th className="px-3.5 py-2.5 font-medium">Baseline</th>
                  <th className="px-3.5 py-2.5 font-medium">What-If</th>
                  <th className="px-3.5 py-2.5 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody className="mono">
                <tr className="border-b border-hairline">
                  <td className="px-3.5 py-2.5 text-ink-dim">Risk Score</td>
                  <td className="px-3.5 py-2.5 text-ink-faint">{baseline.riskScore}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-ink">{result.riskScore}</td>
                  <td className="px-3.5 py-2.5">
                    <DeltaTag value={result.riskScore - baseline.riskScore} />
                  </td>
                </tr>
                <tr className="border-b border-hairline">
                  <td className="px-3.5 py-2.5 text-ink-dim">Affected Population</td>
                  <td className="px-3.5 py-2.5 text-ink-faint">{baseline.affectedPopulationM}M</td>
                  <td className="px-3.5 py-2.5 font-semibold text-ink">{result.affectedPopulationM}M</td>
                  <td className="px-3.5 py-2.5">
                    <DeltaTag value={result.affectedPopulationM - baseline.affectedPopulationM} suffix="M" />
                  </td>
                </tr>
                <tr className="border-b border-hairline">
                  <td className="px-3.5 py-2.5 text-ink-dim">High-Risk Zones</td>
                  <td className="px-3.5 py-2.5 text-ink-faint">{baseline.highRiskZones}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-ink">{result.highRiskZones}</td>
                  <td className="px-3.5 py-2.5">
                    <DeltaTag value={result.highRiskZones - baseline.highRiskZones} />
                  </td>
                </tr>
                <tr className="border-b border-hairline">
                  <td className="px-3.5 py-2.5 text-ink-dim">Hospital Risk</td>
                  <td className="px-3.5 py-2.5">
                    <RiskPill level={baselineHospitalRisk} />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <RiskPill level={simulatedHospitalRisk} />
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-faint">
                    {baselineHospitalRisk === simulatedHospitalRisk ? 'No change' : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 text-ink-dim">Emergency Priority</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${priorityStyle[baseline.emergencyPriority]}`}>
                      {baseline.emergencyPriority}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${priorityStyle[result.emergencyPriority]}`}>
                      {result.emergencyPriority}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-faint">
                    {baseline.emergencyPriority === result.emergencyPriority ? 'No change' : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            These same What-If values now drive the risk map's zone sizing and track, the Hospital
            Preparedness and Communication Risk tables, and the AI Disaster Commander — visit any of
            those sections while this scenario is active to see them respond.
          </p>
        </div>
      </div>
    </Panel>
  );
}
