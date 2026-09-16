import type { ReactNode } from 'react';
import type { RiskLevel } from '../types';

export function DemoTag({ children = 'DEMO / SIMULATED DATA' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-signal">
      <span className="h-1.5 w-1.5 rounded-full bg-signal" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-4">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-medium text-data">{eyebrow}</p>}
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-dim">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-hairline bg-panel ${className}`}>{children}</div>
  );
}

export function PanelHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {note && <span className="text-[11px] text-ink-faint">{note}</span>}
    </div>
  );
}

const riskColorMap: Record<RiskLevel, string> = {
  LOW: 'text-safe bg-safe/10 border-safe/30',
  MEDIUM: 'text-warn bg-warn/10 border-warn/30',
  HIGH: 'text-critical bg-critical/10 border-critical/30',
};

export function RiskPill({ level, className = '' }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${riskColorMap[level]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}

export function riskDotColor(level: RiskLevel): string {
  return level === 'HIGH' ? 'var(--color-critical)' : level === 'MEDIUM' ? 'var(--color-warn)' : 'var(--color-safe)';
}

export function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'signal' | 'data' | 'warn' | 'critical' | 'safe';
}) {
  const toneClass: Record<string, string> = {
    default: 'text-ink',
    signal: 'text-signal',
    data: 'text-data',
    warn: 'text-warn',
    critical: 'text-critical',
    safe: 'text-safe',
  };
  return (
    <Panel className="px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mono mt-1.5 text-2xl font-semibold leading-none ${toneClass[tone]}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[12px] text-ink-dim">{sub}</p>}
    </Panel>
  );
}
