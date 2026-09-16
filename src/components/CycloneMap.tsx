import { useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { nearbyCities } from '../data/demoData';
import { useSimulation } from '../context/SimulationContext';
import type { EmergencyPriority } from '../utils/simulation';
import { riskDotColor } from './ui';

// -----------------------------------------------------------------------------
// Map tiles: OpenStreetMap's standard public raster tile servers.
// This is the same free, no-signup, no-API-key tile endpoint used in every
// stock Leaflet quick-start. It requires only the standard OSM attribution
// below — no account, token, or paid plan of any kind.
// A CSS filter (see .map-dark-tiles in index.css) re-tints the light OSM
// tiles to match the dashboard's dark theme in dark mode, so no separate
// dark tile service is required either.
// -----------------------------------------------------------------------------
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_SUBDOMAINS = ['a', 'b', 'c'];

const RISK_FILL: Record<string, string> = {
  HIGH: 'var(--color-critical)',
  MEDIUM: 'var(--color-warn)',
  LOW: 'var(--color-safe)',
};

const PRIORITY_COLOR: Record<EmergencyPriority, string> = {
  STANDARD: 'var(--color-safe)',
  ELEVATED: 'var(--color-data)',
  HIGH: 'var(--color-warn)',
  CRITICAL: 'var(--color-critical)',
};

const BASELINE_REF_COLOR = 'var(--color-ink-faint)';

// Rough decorative coastline used only by the offline fallback grid below —
// not geographically precise, just enough to visually anchor the demo region.
const FALLBACK_COAST = 'M 60,10 C 90,60 70,120 110,170 C 140,210 130,260 170,300';

function OfflineGraticule() {
  const lats = [12, 14, 16, 18, 20, 22];
  const lngs = [78, 80, 82, 84, 86, 88];
  return (
    <div className="pointer-events-none absolute inset-0 z-[350] bg-void-raised">
      <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="none">
        <rect x="0" y="0" width="400" height="300" style={{ fill: 'var(--color-void-raised)' }} />
        {lngs.map((lng, i) => (
          <line
            key={lng}
            x1={(i / (lngs.length - 1)) * 400}
            y1="0"
            x2={(i / (lngs.length - 1)) * 400}
            y2="300"
            style={{ stroke: 'var(--color-hairline)' }}
            strokeWidth="1"
          />
        ))}
        {lats.map((lat, i) => (
          <line
            key={lat}
            x1="0"
            y1={(i / (lats.length - 1)) * 300}
            x2="400"
            y2={(i / (lats.length - 1)) * 300}
            style={{ stroke: 'var(--color-hairline)' }}
            strokeWidth="1"
          />
        ))}
        <path
          d={FALLBACK_COAST}
          transform="translate(150,-20) scale(0.9)"
          fill="none"
          style={{ stroke: 'var(--color-hairline-strong)' }}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute bottom-2 right-2 rounded-md border border-hairline-strong bg-panel px-2 py-1 text-[10px] text-ink-faint">
        Live map tiles unavailable — showing offline coordinate grid. Markers below remain accurate.
      </span>
    </div>
  );
}

function Legend({ isModified, priority }: { isModified: boolean; priority: EmergencyPriority }) {
  const items = [
    { label: 'Current Position', color: 'var(--color-signal)', shape: 'dot' as const },
    { label: 'Historical Track', color: 'var(--color-ink-faint)', shape: 'line' as const },
    { label: isModified ? 'Simulated Track' : 'Predicted Track', color: PRIORITY_COLOR[priority], shape: 'dashed' as const },
    { label: 'High Risk', color: 'var(--color-critical)', shape: 'zone' as const },
    { label: 'Medium Risk', color: 'var(--color-warn)', shape: 'zone' as const },
    { label: 'Low Risk', color: 'var(--color-safe)', shape: 'zone' as const },
  ];
  if (isModified) {
    items.push({ label: 'Baseline Reference', color: BASELINE_REF_COLOR, shape: 'dashed' as const });
  }
  return (
    <div className="absolute bottom-3 left-3 z-[400] rounded-lg border border-hairline-strong bg-panel-raised/95 px-3 py-2.5 backdrop-blur">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Legend</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            {item.shape === 'zone' ? (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${item.color} 35%, transparent)`, border: `1.5px solid ${item.color}` }}
              />
            ) : item.shape === 'dot' ? (
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            ) : (
              <span
                className="h-0.5 w-3.5"
                style={{ borderTop: `2px dashed ${item.color}` }}
              />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CycloneMap({ height = 'h-[480px]', showRiskZones = true }: { height?: string; showRiskZones?: boolean }) {
  const [tileError, setTileError] = useState(false);
  const { result, baseline, isModified } = useSimulation();

  const historyLine = useMemo(
    () => result.trackPoints.filter((p) => p.kind === 'history' || p.kind === 'current').map((p) => [p.lat, p.lng] as [number, number]),
    [result.trackPoints]
  );
  const forecastLine = useMemo(
    () => result.trackPoints.filter((p) => p.kind === 'forecast' || p.kind === 'current').map((p) => [p.lat, p.lng] as [number, number]),
    [result.trackPoints]
  );
  const baselineForecastLine = useMemo(
    () => baseline.trackPoints.filter((p) => p.kind === 'forecast' || p.kind === 'current').map((p) => [p.lat, p.lng] as [number, number]),
    [baseline.trackPoints]
  );

  const trackColor = PRIORITY_COLOR[result.emergencyPriority];
  const center: [number, number] = [17.4, 83.2];

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-hairline map-dark-tiles ${height}`}>
      <MapContainer center={center} zoom={6} scrollWheelZoom className="h-full w-full">
        {!tileError ? (
          <TileLayer
            attribution={TILE_ATTRIBUTION}
            url={TILE_URL}
            subdomains={TILE_SUBDOMAINS}
            maxZoom={19}
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
        ) : null}

        {tileError && <OfflineGraticule />}

        {/* Baseline reference zones — shown only once the scenario has been changed,
            as a thin dashed outline so the simulated result is visually comparable. */}
        {showRiskZones &&
          isModified &&
          baseline.riskZones.map((zone) => (
            <Circle
              key={`baseline-${zone.id}`}
              center={[zone.lat, zone.lng]}
              radius={zone.radiusKm * 1000}
              pathOptions={{
                color: BASELINE_REF_COLOR,
                fillOpacity: 0,
                weight: 1.2,
                dashArray: '4 4',
              }}
            />
          ))}

        {/* Current (baseline-or-simulated) risk zones */}
        {showRiskZones &&
          result.riskZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radiusKm * 1000 * zone.radiusMultiplier}
              pathOptions={{
                color: RISK_FILL[zone.level],
                fillColor: RISK_FILL[zone.level],
                fillOpacity: 0.14,
                weight: 1.6,
              }}
            >
              <Tooltip direction="top">
                {zone.name} &middot; {zone.level} risk
                {isModified && ` (×${zone.radiusMultiplier.toFixed(2)} baseline radius)`}
              </Tooltip>
            </Circle>
          ))}

        <Polyline positions={historyLine} pathOptions={{ color: 'var(--color-ink-faint)', weight: 2.5, opacity: 0.9 }} />

        {/* Baseline predicted track, shown dashed/dim once the scenario diverges */}
        {isModified && (
          <Polyline
            positions={baselineForecastLine}
            pathOptions={{ color: BASELINE_REF_COLOR, weight: 2, opacity: 0.8, dashArray: '3 5' }}
          />
        )}

        <Polyline positions={forecastLine} pathOptions={{ color: trackColor, weight: 2.5, opacity: 0.95, dashArray: '6 6' }} />

        {result.trackPoints.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.kind === 'current' ? 8 : 5}
            pathOptions={{
              color: p.kind === 'current' ? 'var(--color-signal)' : p.kind === 'forecast' ? trackColor : 'var(--color-ink-faint)',
              fillColor: p.kind === 'current' ? 'var(--color-signal)' : p.kind === 'forecast' ? trackColor : 'var(--color-ink-faint)',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="mono">
                <p className="mb-1 font-semibold text-[13px]">{p.label}</p>
                <p>Lat: {p.lat.toFixed(2)} &middot; Lng: {p.lng.toFixed(2)}</p>
                <p>Wind: {p.windKmh} km/h</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {nearbyCities.map((city) => (
          <CircleMarker
            key={city.name}
            center={[city.lat, city.lng]}
            radius={4}
            pathOptions={{
              color: riskDotColor(city.riskLevel),
              fillColor: 'var(--color-panel)',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} permanent={false}>
              <span className="mono">{city.name} &middot; {city.riskLevel}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <Legend isModified={isModified} priority={result.emergencyPriority} />

      <div className="absolute right-3 top-3 z-[400] rounded-lg border border-hairline-strong bg-panel-raised/95 px-3 py-2 text-[11px] text-ink-dim backdrop-blur">
        {isModified ? `Simulated Scenario · ${result.emergencyPriority}` : 'Baseline Scenario · Bay of Bengal Demo'}
      </div>
    </div>
  );
}
