import type { LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { tipAttrs, type Tip } from "@/shared/tooltip/tip";

interface ToolbarButtonProps {
  icon: LucideIcon;
  tip: Tip;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  active?: boolean;
}

/** El tooltip va en el <span>: un botón desactivado no recibe eventos del ratón y así explica por qué. */
export function ToolbarButton({ icon: Icon, tip, onClick, disabled, active }: ToolbarButtonProps) {
  return (
    <span className="inline-flex shrink-0" {...tipAttrs(tip, disabled)}>
      <button
        type="button"
        aria-label={tip.title}
        onClick={onClick}
        disabled={disabled}
        className={`grid size-9 shrink-0 place-items-center rounded-md transition-colors hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-accent ${active ? "text-ok" : "text-muted"}`}
      >
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </button>
    </span>
  );
}
