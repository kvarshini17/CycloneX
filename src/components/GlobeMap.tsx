import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { useSimulation } from '../context/SimulationContext';
import { nearbyCities } from '../data/demoData';

export function GlobeMap({ activeCenter, replayIndex = -1 }: { activeCenter?: [number, number], replayIndex?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 480 });
  const globeEl = useRef<any>(null);
  const { result, appMode, aiData, isModified } = useSimulation();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height || 480 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const historyPoints = useMemo(() => result.trackPoints.filter(p => p.kind === 'history' || p.kind === 'current'), [result.trackPoints]);

  const historyLine = useMemo(() => {
    const pts = replayIndex >= 0 ? historyPoints.slice(0, replayIndex + 1) : historyPoints;
    if (pts.length < 2) return [];
    return [{
      type: 'history',
      coords: pts.map(p => [p.lat, p.lng])
    }];
  }, [historyPoints, replayIndex]);

  const scenarioTrack = useMemo(() => {
    if (replayIndex !== -1 || !isModified) return [];
    const pts = result.trackPoints.filter(p => p.kind === 'forecast' || p.kind === 'current');
    if (pts.length < 2) return [];
    return [{
      type: 'scenario',
      coords: pts.map(p => [p.lat, p.lng])
    }];
  }, [result.trackPoints, replayIndex, isModified]);

  const currentPos = useMemo(() => {
    if (activeCenter) {
       return [{ lat: activeCenter[0], lng: activeCenter[1], size: 1.2, color: 'var(--color-critical)' }];
    }
    const pt = result.trackPoints.find(p => p.kind === 'current');
    if (!pt) return [];
    return [{ lat: pt.lat, lng: pt.lng, size: 1.2, color: 'var(--color-critical)' }];
  }, [result.trackPoints, activeCenter]);

  const aiTrack = useMemo(() => {
    if (replayIndex !== -1) return [];
    const current = result.trackPoints.find(p => p.kind === 'current');
    if (!current || !aiData) return [];
    return [{
      type: 'ai',
      coords: [
        [current.lat, current.lng],
        [current.lat + aiData.delta_lat, current.lng + aiData.delta_lon]
      ]
    }];
  }, [result.trackPoints, aiData, replayIndex]);

  // Rings for animated cyclone circulation
  const cycloneCirculation = useMemo(() => {
    if (currentPos.length === 0) return [];
    return [{
      lat: currentPos[0].lat,
      lng: currentPos[0].lng,
      maxRadius: Math.max(3, result.windKmh / 15),
      propagationSpeed: 1 + (result.windKmh / 100),
      repeatPeriod: Math.max(400, 1500 - (result.windKmh * 5))
    }];
  }, [currentPos, result.windKmh]);

  const labelsData = useMemo(() => {
    return [
      ...nearbyCities.map(c => ({ lat: c.lat, lng: c.lng, text: c.name, size: 0.35, type: 'city' })),
      { lat: 20.59, lng: 78.96, text: 'INDIA', size: 0.8, type: 'country' },
      { lat: 7.87, lng: 80.77, text: 'SRI LANKA', size: 0.5, type: 'country' },
      { lat: 23.68, lng: 90.35, text: 'BANGLADESH', size: 0.5, type: 'country' },
      { lat: 21.91, lng: 95.95, text: 'MYANMAR', size: 0.5, type: 'country' },
    ];
  }, []);

  useEffect(() => {
    if (globeEl.current && currentPos.length > 0) {
      const controls = globeEl.current.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      globeEl.current.pointOfView({ 
        lat: currentPos[0].lat - 8, 
        lng: currentPos[0].lng + 8, 
        altitude: 0.6 
      }, 1500);
    }
  }, [currentPos, appMode]);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ height: '100%', minHeight: '480px' }}>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="rgba(5, 5, 10, 1)"
        
        showAtmosphere={true}
        atmosphereColor="rgba(200, 230, 255, 0.6)"
        atmosphereAltitude={0.15}

        labelsData={labelsData}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelText={(d: any) => d.text}
        labelSize={(d: any) => d.size}
        labelIncludeDot={(d: any) => d.type === 'city'}
        labelDotRadius={(d: any) => d.type === 'city' ? 0.15 : 0}
        labelColor={(d: any) => d.type === 'country' ? 'rgba(255,255,255,0.7)' : 'rgba(200,200,200,0.9)'}
        labelAltitude={0.005}
        labelResolution={2}

        pathsData={[...historyLine, ...aiTrack, ...scenarioTrack]}
        pathPoints={(d: any) => d.coords}
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathColor={(d: any) => {
          if (d.type === 'ai') return 'rgba(255, 50, 50, 0.9)';
          if (d.type === 'scenario') return 'rgba(255, 150, 0, 0.9)';
          return 'rgba(0, 150, 255, 0.8)';
        }}
        pathDashLength={(d: any) => d.type === 'history' ? 0 : 0.01}
        pathDashGap={(d: any) => d.type === 'history' ? 0 : 0.005}
        pathDashAnimateTime={(d: any) => d.type === 'history' ? 0 : 2000}
        pathStroke={2}
        
        ringsData={cycloneCirculation}
        ringLat={(d: any) => d.lat}
        ringLng={(d: any) => d.lng}
        ringColor={() => (t: number) => `rgba(255, 100, 100, ${1 - t})`}
        ringMaxRadius={(d: any) => d.maxRadius}
        ringPropagationSpeed={(d: any) => d.propagationSpeed}
        ringRepeatPeriod={(d: any) => d.repeatPeriod}
        
        htmlElementsData={currentPos}
        htmlElement={() => {
          const el = document.createElement('div');
          // pointer-events-none prevents this HTML overlay from blocking globe interactions like rotation/panning
          el.innerHTML = `
            <div style="color: white; background: rgba(0,0,0,0.65); border: 1px solid var(--color-critical); padding: 4px; border-radius: 4px; font-size: 10px; font-family: monospace; white-space: nowrap; backdrop-filter: blur(2px); pointer-events: none; transform: translate(-50%, 0);">
              <strong style="color: var(--color-signal); font-size: 11px; display: block; margin-bottom: 2px;">${result.stage}</strong>
              Wind: ${result.windKmh} km/h<br/>
              Pres: ${result.pressureHpa} hPa
            </div>
          `;
          return el;
        }}
      />
      
      <div className="absolute top-4 left-4 rounded bg-void/80 px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-warn border border-warn/30 backdrop-blur-sm">
        {appMode === 'REAL' ? 'LIVE METEOROLOGICAL 3D' : 'DEMO METEOROLOGICAL VISUALIZATION'}
      </div>

      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-lg border border-hairline bg-panel/80 p-3 text-[11px] backdrop-blur-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">3D Legend</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-[rgba(0,150,255,0.8)]" />
          <span className="text-ink-dim">Observed Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full border-t-[3px] border-dashed border-[rgba(255,50,50,0.9)] bg-transparent" />
          <span className="text-ink-dim">AI One-Step Predict</span>
        </div>
        {isModified && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-4 rounded-full border-t-[3px] border-dashed border-[rgba(255,150,0,0.9)] bg-transparent" />
            <span className="text-ink-dim">What-If Scenario Track</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-[1.5px] border-[rgba(255,100,100,0.6)] bg-[rgba(255,100,100,0.1)]" />
          <span className="text-ink-dim">Animated Circulation Field</span>
        </div>
      </div>
    </div>
  );
}
