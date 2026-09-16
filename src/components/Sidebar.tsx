import { Activity, Compass, Gauge, Layers, LayoutDashboard, Radio, Waves } from 'lucide-react';

export type SectionId =
  | 'dashboard'
  | 'sources'
  | 'analysis'
  | 'prediction'
  | 'risk'
  | 'simulator'
  | 'intelligence';

const NAV_ITEMS: { id: SectionId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sources', label: 'Multi-Source Data', icon: Layers },
  { id: 'analysis', label: 'Cyclone Analysis', icon: Waves },
  { id: 'prediction', label: 'Prediction', icon: Compass },
  { id: 'risk', label: 'Risk Assessment', icon: Gauge },
  { id: 'simulator', label: 'What-If Simulator', icon: Activity },
  { id: 'intelligence', label: 'Emergency Intelligence', icon: Radio },
];

export function Sidebar({
  active,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-hairline bg-void-raised transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-hairline px-5 py-5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10">
            <span className="absolute h-2.5 w-2.5 rounded-full border border-signal cyclone-pulse" />
            <span className="h-2 w-2 rounded-full bg-signal" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-none tracking-tight text-ink">CYCLONEX</p>
            <p className="mt-1 text-[10px] font-medium leading-none text-ink-faint">
              Cyclone Intelligence Platform
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? 'bg-signal/10 text-signal'
                    : 'text-ink-dim hover:bg-panel-hover hover:text-ink'
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-hairline px-5 py-4">
          <p className="text-[10.5px] leading-relaxed text-ink-faint">
            SIH 2026 &middot; Problem Statement SIH26070
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-ink-faint">
            All cyclone data on this screen is simulated for demonstration.
          </p>
        </div>
      </aside>
    </>
  );
}
