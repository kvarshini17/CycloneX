import { Compass, Gauge, Navigation, Wind } from 'lucide-react';
import { cycloneProfile } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import { DemoTag, Panel, PanelHeader } from './ui';

function Metric({ icon: Icon, label, value, unit }: { icon: typeof Wind; label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-panel-raised px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-data/10 text-data">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[11px] text-ink-faint">{label}</p>
        <p className="mono text-[15px] font-semibold text-ink">
          {value} {unit && <span className="text-[11px] font-normal text-ink-dim">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export function CycloneAnalysisPanel() {
  const { result, isModified } = useSimulation();
  const movement = isModified
    ? result.inputs.trackShiftKm < 0
      ? `${cycloneProfile.movementDirection} (shifted toward coast)`
      : result.inputs.trackShiftKm > 0
        ? `${cycloneProfile.movementDirection} (shifted away from coast)`
        : cycloneProfile.movementDirection
    : cycloneProfile.movementDirection;

  return (
    <Panel>
      <PanelHeader title={`Selected System — ${cycloneProfile.name}`} note={isModified ? 'Simulated scenario' : 'Demo scenario'} />
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <DemoTag>DEMO SCENARIO</DemoTag>
          <span className="rounded-md border border-hairline-strong px-2 py-0.5 text-[11px] text-ink-dim">
            Basin: {cycloneProfile.basin}
          </span>
          <span className="rounded-md border border-signal/30 bg-signal/10 px-2 py-0.5 text-[11px] font-medium text-signal">
            Stage: {result.stage}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Metric icon={Wind} label="Wind Speed" value={`${result.windKmh}`} unit="km/h" />
          <Metric icon={Gauge} label="Central Pressure" value={`${result.pressureHpa}`} unit="hPa" />
          <Metric icon={Navigation} label="Movement" value={movement} />
          <Metric icon={Compass} label="Speed" value={`${cycloneProfile.speedKmh}`} unit="km/h" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-data/25 bg-data/5 px-4 py-3 text-center">
            <p className="text-[11px] text-ink-faint">Cyclone Probability</p>
            <p className="mono mt-1 text-2xl font-bold text-data">{cycloneProfile.probabilityPercent}%</p>
          </div>
          <div className="rounded-lg border border-hairline-strong bg-panel-raised px-4 py-3 text-center">
            <p className="text-[11px] text-ink-faint">Model Confidence</p>
            <p className="mono mt-1 text-2xl font-bold text-ink">{cycloneProfile.confidencePercent}%</p>
          </div>
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
          Values shown are simulated outputs for the CycloneX demo scenario and illustrate the intended
          classification interface — they are not derived from a trained production model.
          {isModified && ' Wind, pressure and stage above are live-updated from the What-If Simulator.'}
        </p>
      </div>
    </Panel>
  );
}
