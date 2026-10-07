import { tipAttrs, type Tip } from "@/shared/tooltip/tip";
import type { ViewMode } from "../../domain/models/json";
import { TIPS } from "../utils/tooltips.constants";

interface ModeTabsProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  /** En modo SQL no hay árbol. */
  treeDisabled: boolean;
  treeTip: Tip;
}

function Tab({ selected, tip, disabled = false, onClick }: { selected: boolean; tip: Tip; disabled?: boolean; onClick: () => void }) {
  return (
    // El tooltip va en el <span>: un botón desactivado no recibe eventos del ratón.
    <span className="flex h-full" {...tipAttrs(tip, disabled)}>
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        disabled={disabled}
        onClick={onClick}
        className={`h-full px-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-35 ${selected ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}
      >
        {tip.title}
      </button>
    </span>
  );
}

export function ModeTabs({ mode, onChange, treeDisabled, treeTip }: ModeTabsProps) {
  return (
    <div role="tablist" className="flex h-11 shrink-0">
      <Tab tip={TIPS.editor} selected={mode === "editor"} onClick={() => onChange("editor")} />
      <Tab tip={treeTip} selected={mode === "tree"} disabled={treeDisabled} onClick={() => onChange("tree")} />
    </div>
  );
}
