import { tipAttrs, type Tip } from "@/shared/tooltip/tip";
import type { ViewMode } from "../../domain/models/json";
import { TIPS } from "../utils/tooltips.constants";

interface ModeTabsProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function Tab({ selected, tip, onClick }: { selected: boolean; tip: Tip; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      {...tipAttrs(tip)}
      className={`h-full px-3 text-sm font-semibold transition-colors ${selected ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}
    >
      {tip.title}
    </button>
  );
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div role="tablist" className="flex h-11 shrink-0">
      <Tab tip={TIPS.editor} selected={mode === "editor"} onClick={() => onChange("editor")} />
      <Tab tip={TIPS.tree} selected={mode === "tree"} onClick={() => onChange("tree")} />
    </div>
  );
}
