import { cycloneProfile } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import { StatCard } from './ui';

export function StatusCards() {
  const { result, isModified } = useSimulation();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Cyclone Status" value="ACTIVE" tone="signal" sub={cycloneProfile.name} />
      <StatCard label="Classification" value={result.stage} tone="default" sub={isModified ? 'Simulated scenario' : 'Category: Severe'} />
      <StatCard label="Current Wind" value={`${result.windKmh} km/h`} tone="warn" sub="Sustained, 3-min avg" />
      <StatCard label="Central Pressure" value={`${result.pressureHpa} hPa`} tone="data" sub="Falling gradually" />
      <StatCard label="Risk Score" value={`${result.riskScore} / 100`} tone="critical" sub={`Overall risk: ${result.overallRisk}`} />
      <StatCard
        label="Prediction"
        value={result.emergencyPriority === 'CRITICAL' ? 'Landfall Risk ↑↑' : 'Landfall Risk ↑'}
        tone="signal"
        sub={isModified ? `What-If scenario active (${result.scoreDelta >= 0 ? '+' : ''}${result.scoreDelta})` : 'Estimated window: +18–24h'}
      />
    </div>
  );
}
