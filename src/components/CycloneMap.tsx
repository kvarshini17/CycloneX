import 'leaflet/dist/leaflet.css';
import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Polyline, Tooltip, Popup, useMap } from 'react-leaflet';
import { nearbyCities } from '../data/demoData';
import type { RiskLevel } from '../types';
import { useSimulation } from '../context/SimulationContext';
import { GlobeMap } from './GlobeMap';
import { Globe2, Map as MapIcon, Play, Pause, RotateCcw } from 'lucide-react';
import type { EmergencyPriority } from '../utils/simulation';

// RESTORED: Original OSM tiles (no API key required)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_SUBDOMAINS = ['a', 'b', 'c'];

const PRIORITY_COLOR: Record<string, string> = {
  STANDARD: 'var(--color-safe)',
  ELEVATED: 'var(--color-data)',
  HIGH: 'var(--color-warn)',
  CRITICAL: 'var(--color-critical)',
};

const RISK_FILL: Record<RiskLevel, string> = {
  LOW: 'var(--color-safe)',
  MEDIUM: 'var(--color-warn)',
  HIGH: 'var(--color-critical)',
};

const BASELINE_REF_COLOR = 'var(--color-ink-faint)';

function riskDotColor(level: string) {
  if (level === 'High') return 'var(--color-critical)';
  if (level === 'Medium') return 'var(--color-warn)';
  return 'var(--color-safe)';
}

function OfflineGraticule() {
  const lats = Array.from({ length: 9 }, (_, i) => 12 + i * 1);
  const lngs = Array.from({ length: 9 }, (_, i) => 80 + i * 1);
  const FALLBACK_COAST = "M 100,300 L 150,250 L 160,200 L 190,150 L 220,120 L 250,90 L 300,50";

  return (
    <div className="absolute inset-0 z-[1] bg-void">
      <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
        {lngs.map((lng, i) => (
          <line key={`lng-${lng}`} x1={(i / (lngs.length - 1)) * 400} y1="0" x2={(i / (lngs.length - 1)) * 400} y2="300" style={{ stroke: 'var(--color-hairline)' }} strokeWidth="1" />
        ))}
        {lats.map((lat, i) => (
          <line key={`lat-${lat}`} x1="0" y1={(i / (lats.length - 1)) * 300} x2="400" y2={(i / (lats.length - 1)) * 300} style={{ stroke: 'var(--color-hairline)' }} strokeWidth="1" />
        ))}
        <path d={FALLBACK_COAST} transform="translate(150,-20) scale(0.9)" fill="none" style={{ stroke: 'var(--color-hairline-strong)' }} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-2 right-2 rounded-md border border-hairline-strong bg-panel px-2 py-1 text-[10px] text-ink-faint">Live map tiles unavailable - showing offline grid.</span>
    </div>
  );
}

function Legend({ isModified, priority, aiData }: { isModified: boolean; priority: EmergencyPriority, aiData: any }) {
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
  if (aiData) {
    items.push({ label: 'AI SIH26070 Output', color: 'rgba(255,50,50,0.9)', shape: 'dashed' as const });
  }
  return (
    <div className="absolute bottom-3 left-3 z-[400] rounded-lg border border-hairline-strong bg-panel-raised/95 px-3 py-2.5 backdrop-blur">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Legend</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            {item.shape === 'zone' ? (
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `color-mix(in srgb, ${item.color} 35%, transparent)`, border: `1.5px solid ${item.color}` }} />
            ) : item.shape === 'dot' ? (
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            ) : (
              <span className="h-0.5 w-3.5" style={{ borderTop: `2px dashed ${item.color}` }} />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Map center automatic controller
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center, map]);
  return null;
}

export function CycloneMap({ height = 'h-[480px]', showRiskZones = true }: { height?: string; showRiskZones?: boolean }) {
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('2D');
  const [tileError, setTileError] = useState(false);
  const { result, baseline, isModified, aiData, appMode } = useSimulation();

  // Replay State
  const [replayIndex, setReplayIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const historyPoints = useMemo(() => result.trackPoints.filter(p => p.kind === 'history' || p.kind === 'current'), [result.trackPoints]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && appMode === 'DEMO') {
      interval = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= historyPoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, historyPoints, appMode]);

  const activeReplayPoint = replayIndex >= 0 ? historyPoints[replayIndex] : null;

  const currentCenter = useMemo(() => {
    if (activeReplayPoint) return [activeReplayPoint.lat, activeReplayPoint.lng] as [number, number];
    const curr = result.trackPoints.find(p => p.kind === 'current');
    return curr ? [curr.lat, curr.lng] as [number, number] : [17.4, 83.2] as [number, number];
  }, [result.trackPoints, activeReplayPoint]);

  const historyLine = useMemo(() => {
    const pts = replayIndex >= 0 ? historyPoints.slice(0, replayIndex + 1) : historyPoints;
    return pts.map((p) => [p.lat, p.lng] as [number, number]);
  }, [historyPoints, replayIndex]);
  
  const forecastLine = useMemo(() => result.trackPoints.filter((p) => p.kind === 'forecast' || p.kind === 'current').map((p) => [p.lat, p.lng] as [number, number]), [result.trackPoints]);
  const baselineForecastLine = useMemo(() => baseline.trackPoints.filter((p) => p.kind === 'forecast' || p.kind === 'current').map((p) => [p.lat, p.lng] as [number, number]), [baseline.trackPoints]);
  
  const aiLine = useMemo(() => {
    const curr = result.trackPoints.find(p => p.kind === 'current');
    if (!curr || !aiData) return null;
    return [[curr.lat, curr.lng], [curr.lat + aiData.delta_lat, curr.lng + aiData.delta_lon]] as [number, number][];
  }, [result.trackPoints, aiData]);

  const trackColor = PRIORITY_COLOR[result.emergencyPriority];

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-hairline ${height} ${viewMode === '2D' && !tileError ? 'bg-[#f8f9fa]' : 'bg-void-raised'}`}>
      
      {/* View Toggle */}
      <div className="absolute right-3 top-3 z-[500] flex overflow-hidden rounded-md border border-hairline bg-panel shadow-sm">
        <button
          onClick={() => setViewMode('2D')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === '2D' ? 'bg-signal text-void' : 'text-ink-dim hover:bg-panel-hover hover:text-ink'}`}
        >
          <MapIcon size={13} /> 2D Map
        </button>
        <button
          onClick={() => setViewMode('3D')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${viewMode === '3D' ? 'bg-signal text-void' : 'text-ink-dim hover:bg-panel-hover hover:text-ink'}`}
        >
          <Globe2 size={13} /> 3D Earth
        </button>
      </div>

      {/* Replay Controls */}
      {appMode === 'DEMO' && (
        <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg border border-hairline-strong bg-panel-raised/95 px-3 py-2 text-[11px] backdrop-blur">
          <span className="font-semibold text-ink-dim uppercase">Replay Demo:</span>
          <button onClick={() => setIsPlaying(!isPlaying)} className="rounded p-1 hover:bg-panel-hover text-ink">
            {isPlaying ? <Pause size={14}/> : <Play size={14}/>}
          </button>
          <button onClick={() => { setIsPlaying(false); setReplayIndex(-1); }} className="rounded p-1 hover:bg-panel-hover text-ink" title="Reset">
            <RotateCcw size={14}/>
          </button>
          <span className="mono text-ink-dim ml-2">{activeReplayPoint ? activeReplayPoint.label : 'LIVE/LATEST'}</span>
        </div>
      )}

      {viewMode === '3D' ? (
        <GlobeMap activeCenter={currentCenter} replayIndex={replayIndex} />
      ) : (
        <MapContainer center={currentCenter} zoom={6} scrollWheelZoom className="h-full w-full bg-transparent map-dark-tiles" zoomControl={false}>
          <MapCenterController center={currentCenter} />
          
          {!tileError && (
            <TileLayer
              attribution={TILE_ATTRIBUTION}
              url={TILE_URL}
              subdomains={TILE_SUBDOMAINS as any}
              maxZoom={19}
              eventHandlers={{ tileerror: () => setTileError(true) }}
            />
          )}

          {tileError && <OfflineGraticule />}

          {/* Baseline reference zones */}
          {showRiskZones && isModified && baseline.riskZones.map((zone) => (
            <Circle key={`baseline-${zone.id}`} center={[zone.lat, zone.lng]} radius={zone.radiusKm * 1000} pathOptions={{ color: BASELINE_REF_COLOR, fillOpacity: 0, weight: 1.2, dashArray: '4 4' }} />
          ))}

          {/* Current risk zones */}
          {showRiskZones && result.riskZones.map((zone) => (
            <Circle key={zone.id} center={replayIndex >= 0 && activeReplayPoint ? [activeReplayPoint.lat, activeReplayPoint.lng] : [zone.lat, zone.lng]} radius={zone.radiusKm * 1000 * zone.radiusMultiplier} pathOptions={{ color: RISK_FILL[zone.level], fillColor: RISK_FILL[zone.level], fillOpacity: 0.14, weight: 1.6 }}>
              <Tooltip direction="top">{zone.name} &middot; {zone.level} risk {isModified && `(x${zone.radiusMultiplier.toFixed(2)})`}</Tooltip>
            </Circle>
          ))}

          <Polyline positions={historyLine} pathOptions={{ color: 'var(--color-ink-faint)', weight: 2.5, opacity: 0.9 }} />

          {/* Baseline forecasted track */}
          {isModified && <Polyline positions={baselineForecastLine} pathOptions={{ color: BASELINE_REF_COLOR, weight: 2, opacity: 0.8, dashArray: '3 5' }} />}
          
          {/* Main scenario predicted track */}
          {replayIndex === -1 && <Polyline positions={forecastLine} pathOptions={{ color: trackColor, weight: 2.5, opacity: 0.95, dashArray: '6 6' }} />}
          
          {/* AI Track Overlay */}
          {aiLine && replayIndex === -1 && <Polyline positions={aiLine} pathOptions={{ color: 'rgba(255, 50, 50, 0.9)', weight: 3.5, opacity: 1, dashArray: '8 8' }} />}

          {/* Points */}
          {result.trackPoints.filter(p => replayIndex === -1 || p.kind === 'history' || p.kind === 'current').map((p, idx) => {
            const isReplayTarget = replayIndex >= 0 && idx === replayIndex;
            const isCurrent = p.kind === 'current' && replayIndex === -1;
            const isActive = isCurrent || isReplayTarget;
            return (
              <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={isActive ? 8 : 4} pathOptions={{ color: isActive ? 'var(--color-signal)' : (p.kind === 'forecast' ? trackColor : 'var(--color-ink-faint)'), fillColor: isActive ? 'var(--color-signal)' : (p.kind === 'forecast' ? trackColor : 'var(--color-panel)'), fillOpacity: isActive ? 0.9 : 1, weight: 2 }}>
                <Popup>
                  <div className="mono">
                    <p className="mb-1 font-semibold text-[13px]">{p.label}</p>
                    <p>Lat: {p.lat.toFixed(2)} &middot; Lng: {p.lng.toFixed(2)}</p>
                    <p>Wind: {p.windKmh} km/h</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {nearbyCities.map((city) => (
            <CircleMarker key={city.name} center={[city.lat, city.lng]} radius={4} pathOptions={{ color: riskDotColor(city.riskLevel), fillColor: 'var(--color-panel)', fillOpacity: 1, weight: 2 }}>
              <Tooltip direction="top" offset={[0, -4]} permanent={false}><span className="mono">{city.name} &middot; {city.riskLevel}</span></Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      )}

      {viewMode === '2D' && <Legend isModified={isModified} priority={result.emergencyPriority} aiData={aiData} />}
    </div>
  );
}
