import type { ReactNode } from "react";

const toneClass = { p: "pill pill--p", s: "pill", g: "pill pill--g" } as const;

export function Pill({ tone = "s", children }: { tone?: keyof typeof toneClass; children: ReactNode }) {
  return <span className={toneClass[tone]}>{children}</span>;
}

export function StatusPill({ status }: { status: { label: string; tone: keyof typeof toneClass } }) {
  return <Pill tone={status.tone}>{status.label}</Pill>;
}
