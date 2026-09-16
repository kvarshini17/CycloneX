import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { derivePredictionRows } from '../utils/simulation';
import { Panel, PanelHeader, RiskPill } from './ui';

export function PredictionPanel() {
  const { result, isModified, appMode } = useSimulation();
  const rows = derivePredictionRows(result.trackPoints);

  return (
    <Panel>
      <PanelHeader title="24-Hour Track & Intensity Prediction" note={isModified ? 'Simulated scenario' : (appMode === 'REAL' ? 'Live ML Inference' : 'Demo prediction')} />
      <div className="p-4">
        <p className="mb-4 rounded-lg border border-data/25 bg-data/5 px-3.5 py-2.5 text-[12px] text-data">
          {appMode === 'REAL' ? 'Live ML prediction based on real-time weather and satellite features' : 'AI-based prediction estimate for demonstration purposes'} — not an official meteorological forecast.
          {isModified && ' Values below reflect the active What-If scenario.'}
        </p>

        <div className="mb-5 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-data)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-data)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'var(--color-ink-faint)', fontSize: 11.5 }} axisLine={{ stroke: 'var(--color-hairline)' }} tickLine={false} />
              <YAxis
                tick={{ fill: 'var(--color-ink-faint)', fontSize: 11.5 }}
                axisLine={false}
                tickLine={false}
                width={44}
                domain={[40, 160]}
                label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: 'var(--color-ink-faint)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ background: 'var(--color-panel-raised)', border: '1px solid var(--color-hairline-strong)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--color-ink)' }}
              />
              <Area type="monotone" dataKey="windKmh" stroke="var(--color-data)" strokeWidth={2} fill="url(#windGradient)" name="Wind (km/h)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline bg-panel-raised text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-3.5 py-2.5 font-medium">Time</th>
                <th className="px-3.5 py-2.5 font-medium">Latitude</th>
                <th className="px-3.5 py-2.5 font-medium">Longitude</th>
                <th className="px-3.5 py-2.5 font-medium">Wind</th>
                <th className="px-3.5 py-2.5 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.time} className="border-b border-hairline last:border-0 hover:bg-panel-hover">
                  <td className="mono px-3.5 py-2.5 font-medium text-ink">{row.time}</td>
                  <td className="mono px-3.5 py-2.5 text-ink-dim">{row.lat.toFixed(2)}&deg;N</td>
                  <td className="mono px-3.5 py-2.5 text-ink-dim">{row.lng.toFixed(2)}&deg;E</td>
                  <td className="mono px-3.5 py-2.5 text-ink-dim">{row.windKmh} km/h</td>
                  <td className="px-3.5 py-2.5">
                    <RiskPill level={row.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

