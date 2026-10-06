"use client";

import { useTooltip } from "./useTooltip";

/** Tooltip global: se monta una vez en la página y muestra el de cualquier elemento con `data-tip`. */
export function Tooltip() {
  const tip = useTooltip();
  if (!tip) return null;

  return (
    <div
      role="tooltip"
      style={tip.style}
      className={`pointer-events-none fixed z-50 w-max max-w-[280px] -translate-x-1/2 animate-[tip-in_120ms_ease-out] rounded-lg border border-border bg-panel px-3 py-2 text-xs shadow-xl ${tip.placement === "above" ? "origin-bottom" : "origin-top"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-fg">{tip.title}</span>
        {tip.keys && (
          <kbd className="shrink-0 rounded border border-border bg-bg px-1.5 py-px font-mono text-[10px] text-muted">{tip.keys}</kbd>
        )}
      </div>
      {tip.desc && <p className="mt-0.5 leading-snug text-muted">{tip.desc}</p>}
    </div>
  );
}
