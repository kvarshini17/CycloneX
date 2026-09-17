import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { derivePredictionRows } from '../utils/simulation';
import { Panel, PanelHeader, RiskPill } from './ui';
import { Activity, Crosshair, AlertCircle, Navigation } from 'lucide-react';

export function PredictionPanel() {
  const { result, isModified, appMode, aiData, aiStatus } = useSimulation();
  const rows = derivePredictionRows(result.trackPoints);

  const CATEGORIES = [
    'Depression (D)',
    'Deep Depression (DD)',
    'Cyclonic Storm (CS)',
    'Severe Cyclonic Storm (SCS)',
    'Very Severe Cyclonic Storm (VSCS)',
    'Extremely Severe Cyclonic Storm (ESCS)',
    'Super Cyclonic Storm (SuCS)'
  ];

  const currentLat = result.trackPoints.find(p => p.kind === 'current')?.lat || 16.9;
  const currentLng = result.trackPoints.find(p => p.kind === 'current')?.lng || 83.6;
  const currentWind = result.windKmh;
  const currentPres = result.pressureHpa;

  return (
    <Panel>
      <PanelHeader title="Track & Intensity Prediction" note={isModified ? 'Simulated scenario' : (appMode === 'REAL' ? 'Live ML Inference' : 'Demo prediction')} />
      <div className="p-4 space-y-6">
        
        {/* SIH26070 AI INTEGRATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OBSERVATION COLUMN */}
          <div className="rounded-xl border border-hairline-strong bg-void-raised p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4 flex items-center gap-2">
              <Crosshair size={14} className="text-safe" />
              OBSERVED DATA
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-dim">Position</span>
                <span className="font-mono text-sm text-ink">{currentLat.toFixed(2)}°N, {currentLng.toFixed(2)}°E</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-dim">Observed Wind</span>
                <span className="font-mono text-sm text-ink">{currentWind} km/h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-dim">Central Pressure</span>
                <span className="font-mono text-sm text-ink">{currentPres} hPa</span>
              </div>
            </div>
          </div>

          {/* AI PREDICTION COLUMN */}
          <div className="rounded-xl border border-hairline-strong bg-void-raised p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4 flex items-center gap-2">
              <Activity size={14} className="text-data" />
              AI MODEL OUTPUT (One-Step)
            </h3>
            
            {aiStatus === 'LOADING' && <div className="text-sm text-ink-faint animate-pulse py-4">Running Inference...</div>}
            {aiStatus === 'OFFLINE' && <div className="text-sm text-critical py-4 flex items-center gap-2"><AlertCircle size={16}/> Local Inference Offline</div>}
            
            {aiStatus === 'ONLINE' && aiData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-hairline pb-2">
                  <span className="text-sm text-ink-dim">AI Classification</span>
                  <span className="font-medium text-[11px] text-warn truncate max-w-[140px] text-right" title={CATEGORIES[aiData.category]}>{CATEGORIES[aiData.category]}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-dim">Predicted Wind</span>
                  <span className="font-mono text-sm text-ink">{aiData.wind.toFixed(1)} km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-dim">Predicted Pressure</span>
                  <span className="font-mono text-sm text-ink">{aiData.pressure.toFixed(1)} hPa</span>
                </div>
                
                <div className="pt-2 border-t border-hairline">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-ink-dim flex items-center gap-1.5"><Navigation size={12}/> Projected Point</span>
                    <span className="font-mono text-xs text-ink">{(currentLat + aiData.delta_lat).toFixed(2)}°N, {(currentLng + aiData.delta_lon).toFixed(2)}°E</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ORIGINAL 24H PREDICTION CHART */}
        <div className="pt-4 border-t border-hairline">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-4">DOWNSTREAM FORECAST/SCENARIO (24-Hour)</h3>
          
          <p className="mb-4 rounded-lg border border-data/25 bg-data/5 px-3.5 py-2.5 text-[12px] text-data">
            {appMode === 'REAL' ? 'Live ML prediction extrapolated forward based on recent dynamics' : 'AI-based prediction estimate for demonstration purposes'} - not an official meteorological forecast.
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

      </div>
    </Panel>
  );
}
