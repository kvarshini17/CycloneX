import { Menu, Moon, RotateCcw, Sun } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { useTheme } from '../theme';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Command Dashboard', subtitle: 'Live overview of the active demo scenario' },
  sources: { title: 'Multi-Source Intelligence', subtitle: 'Satellite, ocean, atmospheric & historical data fusion' },
  analysis: { title: 'Cyclone Analysis', subtitle: 'Classification & detection pipeline for the selected system' },
  prediction: { title: '24-Hour Prediction', subtitle: 'AI-based track & intensity estimate' },
  risk: { title: 'Risk Assessment', subtitle: 'Localized impact scoring across coastal zones' },
  simulator: { title: 'What-If Simulator', subtitle: 'Explore how changing assumptions shifts risk' },
  intelligence: { title: 'Emergency Intelligence', subtitle: 'Prioritized decision-support recommendations' },
};

export function TopBar({ section, onMenuClick }: { section: string; onMenuClick: () => void }) {
  const copy = TITLES[section] ?? TITLES.dashboard;
  const { theme, toggleTheme } = useTheme();
  const { isModified, result, reset, appMode, setAppMode } = useSimulation();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-hairline bg-void/90 px-4 py-3.5 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-dim hover:bg-panel-hover hover:text-ink lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-ink sm:text-base">{copy.title}</h1>
          <p className="hidden text-[12px] text-ink-faint sm:block">{copy.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isModified ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 text-[11px] font-medium text-signal hover:bg-signal/15"
            title="Click to reset the What-If Simulator to baseline"
          >
            <RotateCcw size={11} />
            Simulated A {result.emergencyPriority}
          </button>
        ) : (
          <span className="hidden items-center gap-1.5 rounded-full border border-hairline-strong px-2.5 py-1 text-[11px] text-ink-dim md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-safe" />
            Baseline Scenario
          </span>
        )}
        <button
          onClick={toggleTheme}
          className="rounded-md border border-hairline-strong p-1.5 text-ink-dim hover:bg-panel-hover hover:text-ink"
          title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        
        {/* CRITICAL JURY FEATURE: Top Toggle */}
        <div className="flex items-center rounded-full border border-hairline-strong bg-panel p-0.5 shadow-sm">
          <button
            onClick={() => setAppMode('REAL')}
            className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider transition-colors ${
              appMode === 'REAL' ? 'bg-signal text-white' : 'text-ink-dim hover:text-ink'
            }`}
          >
            REAL DATA
          </button>
          <button
            onClick={() => setAppMode('DEMO')}
            className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider transition-colors ${
              appMode === 'DEMO' ? 'bg-data text-white' : 'text-ink-dim hover:text-ink'
            }`}
          >
            DEMO REPLAY
          </button>
        </div>
      </div>
    </header>
  );
}
