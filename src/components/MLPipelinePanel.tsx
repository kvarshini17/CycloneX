import { ArrowRight, ArrowDown } from 'lucide-react';
import { Panel, PanelHeader } from './ui';

function Node({ children }: { children: string }) {
  return (
    <div className="whitespace-nowrap rounded-lg border border-hairline-strong bg-panel-raised px-3.5 py-2.5 text-center text-[12.5px] font-medium text-ink">
      {children}
    </div>
  );
}

function Flow({ nodes }: { nodes: string[] }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      {nodes.map((n, i) => (
        <div key={n} className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <Node>{n}</Node>
          {i < nodes.length - 1 && (
            <span className="text-ink-faint">
              <ArrowDown size={16} className="sm:hidden" />
              <ArrowRight size={16} className="hidden sm:block" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function MLPipelinePanel() {
  return (
    <Panel>
      <PanelHeader title="AI / ML Pipeline — Architecture Overview" note="PoC representation" />
      <div className="space-y-6 p-4">
        <div>
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Detection &amp; Classification
          </p>
          <Flow nodes={['Satellite Images', 'Image Preprocessing', 'CNN / Transfer Learning', 'Cyclone Detection & Classification']} />
        </div>
        <div>
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Track &amp; Intensity Prediction
          </p>
          <Flow nodes={['Historical + Weather Data', 'ML / Time-Series Model', 'Track & Intensity Prediction']} />
        </div>
        <p className="rounded-lg border border-hairline bg-void-raised px-3.5 py-3 text-[11.5px] leading-relaxed text-ink-faint">
          This diagram represents the proposed architecture for SIH26070. In this prototype, no CNN or
          time-series model has been trained — the pipeline above is illustrative, and outputs shown
          elsewhere in the app are simulated to demonstrate the intended end-to-end workflow.
        </p>
      </div>
    </Panel>
  );
}
