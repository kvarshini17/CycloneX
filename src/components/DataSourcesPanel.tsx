import { Satellite, CloudSun, History, Thermometer, MapPinned, Building2, CheckCircle2 } from 'lucide-react';
import { sourceStatusTracker } from '../services/quality/sourceStatusTracker';
import { Panel } from './ui';

const ICONS = [Satellite, CloudSun, Thermometer, History, MapPinned, Building2];

export function DataSourcesPanel({ onNavigateToSources }: { onNavigateToSources?: () => void }) {
  const sources = sourceStatusTracker.getStatusList();

  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Multi-Source Telemetry Streams</h3>
          <span className="text-[11px] text-ink-faint">Active ingestion layer status</span>
        </div>
        {onNavigateToSources && (
          <button
            onClick={onNavigateToSources}
            className="rounded-md border border-hairline-strong bg-void-raised px-2.5 py-1 text-[11px] font-medium text-data hover:bg-panel-hover"
          >
            View Multi-Source Dashboard →
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div key={source.id} className="rounded-lg border border-hairline bg-panel-raised p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-void text-ink-dim">
                  <Icon size={15} />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    source.badgeType === 'live'
                      ? 'bg-safe/15 text-safe border border-safe/30'
                      : source.badgeType === 'sample'
                      ? 'bg-signal/15 text-signal border border-signal/30'
                      : 'bg-data/15 text-data border border-data/30'
                  }`}
                >
                  {source.badgeLabel}
                </span>
              </div>
              <p className="text-[13px] font-medium text-ink">{source.name}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{source.description}</p>
              <div className="mt-2.5 flex items-center justify-between border-t border-hairline pt-2 text-[10.5px] text-ink-faint">
                <span className="truncate">{source.provider}</span>
                <span className="mono shrink-0">{source.refreshInterval}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t border-hairline px-4 py-3 text-[11px] text-ink-faint">
        <CheckCircle2 size={13} className="text-safe" />
        Transparent data labeling: Live Open-Meteo weather connected where reachable; INSAT-3DR satellite imagery and OISST data represented with authentic calibrated samples.
      </div>
    </Panel>
  );
}
