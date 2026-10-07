import { tipAttrs } from "@/shared/tooltip/tip";
import type { DocLanguage } from "../../domain/models/json";
import { TIPS } from "../utils/tooltips.constants";

interface LanguageSwitchProps {
  language: DocLanguage;
  onChange: (language: DocLanguage) => void;
}

function Option({ selected, label, onClick, tip }: { selected: boolean; label: string; onClick: () => void; tip: typeof TIPS.langJson }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={tip.title}
      onClick={onClick}
      {...tipAttrs(tip)}
      className={`h-6 rounded px-2 font-mono text-[11px] font-bold transition-colors ${selected ? "bg-accent text-white" : "text-muted hover:text-fg"}`}
    >
      {label}
    </button>
  );
}

/** Interruptor JSON | SQL del panel. */
export function LanguageSwitch({ language, onChange }: LanguageSwitchProps) {
  return (
    <div role="group" aria-label="Lenguaje del panel" className="mx-1 flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-bg p-0.5">
      <Option label="JSON" tip={TIPS.langJson} selected={language === "json"} onClick={() => onChange("json")} />
      <Option label="SQL" tip={TIPS.langSql} selected={language === "sql"} onClick={() => onChange("sql")} />
    </div>
  );
}
