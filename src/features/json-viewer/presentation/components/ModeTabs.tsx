import type { ViewMode } from "../../domain/models/json";

interface ModeTabsProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function Tab({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`h-full px-3 text-sm font-semibold transition-colors ${selected ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}
    >
      {label}
    </button>
  );
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div role="tablist" className="flex h-full shrink-0">
      <Tab label="Editor" selected={mode === "editor"} onClick={() => onChange("editor")} />
      <Tab label="Árbol" selected={mode === "tree"} onClick={() => onChange("tree")} />
    </div>
  );
}
