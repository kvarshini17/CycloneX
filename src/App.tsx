import { useState, type ReactElement } from 'react';
import { Sidebar, type SectionId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StatusCards } from './components/StatusCards';
import { CycloneMap } from './components/CycloneMap';
import { CycloneAnalysisPanel } from './components/CycloneAnalysisPanel';
import { MLPipelinePanel } from './components/MLPipelinePanel';
import { DataSourcesPanel } from './components/DataSourcesPanel';
import { PredictionPanel } from './components/PredictionPanel';
import { RiskAssessmentPanel } from './components/RiskAssessmentPanel';
import { HospitalPreparedness } from './components/HospitalPreparedness';
import { CommunicationRisk } from './components/CommunicationRisk';
import { EvacuationShelter } from './components/EvacuationShelter';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AIDisasterCommander } from './components/AIDisasterCommander';
import { MultiSourceIntelligence } from './components/MultiSourceIntelligence';
import { SectionHeading } from './components/ui';

function DashboardSection({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  return (
    <div className="space-y-5">
      <StatusCards />

      {/* Multi-Source Ingestion & Fusion Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline-strong bg-panel-raised px-4 py-3 text-[12px]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
            Multi-Source Inputs:
          </span>
          <span className="rounded bg-void px-2 py-0.5 text-[11px] font-mono text-ink-dim border border-hairline">
            🛰 Satellite (VIS/IR/WV) · SAMPLE
          </span>
          <span className="rounded bg-void px-2 py-0.5 text-[11px] font-mono text-ink-dim border border-hairline">
            🌊 Ocean SST (29.4°C) · SAMPLE
          </span>
          <span className="rounded bg-void px-2 py-0.5 text-[11px] font-mono text-ink-dim border border-hairline">
            🌬 Atmosphere · LIVE / SAMPLE
          </span>
          <span className="rounded bg-void px-2 py-0.5 text-[11px] font-mono text-ink-dim border border-hairline">
            🌀 Historical IBTrACS · READY
          </span>
          <span className="rounded bg-void px-2 py-0.5 text-[11px] font-mono text-ink-dim border border-hairline">
            🗺 GIS / DEM · READY
          </span>
        </div>
        <button
          onClick={() => onNavigate('sources')}
          className="rounded-md border border-hairline-strong bg-void-raised px-3 py-1.5 text-[11.5px] font-medium text-data hover:bg-panel-hover"
        >
          Explore Multi-Source Data &amp; Fusion →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        <CycloneMap height="h-[520px]" />
        <AIDisasterCommander compact />
      </div>
    </div>
  );
}

function MultiSourceSection() {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Ingest → Preprocess → Fuse"
        title="Multi-Source Data Foundation"
        description="Unified observation layer fusing INSAT-3DR multi-spectral satellite imagery, ocean thermodynamics, atmospheric sounding, and historical analogs (SIH26070)."
      />
      <MultiSourceIntelligence />
    </div>
  );
}

function AnalysisSection({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Detect → Classify"
        title="Cyclone Detection & Classification"
        description="Demonstrates how a detected system would be classified and profiled from multi-source satellite data."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CycloneAnalysisPanel />
        <CycloneMap height="h-[420px]" showRiskZones={false} />
      </div>
      <MLPipelinePanel />
      <DataSourcesPanel onNavigateToSources={() => onNavigate('sources')} />
    </div>
  );
}

function PredictionSection() {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Predict"
        title="24-Hour Movement Prediction"
        description="Projected track and intensity for the next 24 hours, plotted against the demo coastline."
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
        <PredictionPanel />
        <CycloneMap height="h-[520px]" />
      </div>
    </div>
  );
}

function RiskSection() {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Assess Risk"
        title="Localized Risk & Impact Assessment"
        description="Coastal risk scoring across flood, wind, storm surge and infrastructure, plus preparedness views."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RiskAssessmentPanel />
        <CycloneMap height="h-[420px]" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <HospitalPreparedness />
        <CommunicationRisk />
      </div>
      <EvacuationShelter />
    </div>
  );
}

function SimulatorSection() {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Simulate"
        title="What-If Cyclone Simulator"
        description="Explore how changing intensity and track assumptions shifts the decision-support indicators."
      />
      <WhatIfSimulator />
    </div>
  );
}

function IntelligenceSection() {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Prioritize Action"
        title="Emergency Intelligence"
        description="AI-assisted, rule-based recommendations to help officials sequence the response."
      />
      <AIDisasterCommander />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <HospitalPreparedness />
        <EvacuationShelter />
      </div>
    </div>
  );
}

const SECTION_COMPONENTS: Record<SectionId, (props: { onNavigate: (id: SectionId) => void }) => ReactElement> = {
  dashboard: DashboardSection,
  sources: MultiSourceSection,
  analysis: AnalysisSection,
  prediction: PredictionSection,
  risk: RiskSection,
  simulator: SimulatorSection,
  intelligence: IntelligenceSection,
};

export default function App() {
  const [section, setSection] = useState<SectionId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ActiveSection = SECTION_COMPONENTS[section];

  return (
    <div className="flex h-screen overflow-hidden bg-void">
      <Sidebar
        active={section}
        onNavigate={setSection}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar section={section} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <ActiveSection onNavigate={setSection} />
          <footer className="mt-10 border-t border-hairline pt-4 pb-2 text-[11px] text-ink-faint">
            CycloneX &middot; SIH 2026 &middot; Problem Statement SIH26070 &middot; Prototype for demonstration
            only — all cyclone data simulated.
          </footer>
        </main>
      </div>
    </div>
  );
}
