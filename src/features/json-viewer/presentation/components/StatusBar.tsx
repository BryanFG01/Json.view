import type { IndentOption } from "../../domain/models/json";
import type { JsonDocumentVM } from "../hooks/useJsonDocument";
import { INDENT_OPTIONS } from "../utils/options.constants";
import { TONE_CLASS } from "../utils/styles.constants";

export function StatusBar({ vm }: { vm: JsonDocumentVM["status"] }) {
  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-border bg-panel px-3 text-xs text-muted">
      <span className={`flex shrink-0 items-center gap-1.5 font-semibold ${TONE_CLASS[vm.tone]}`}>
        <span className="size-2 rounded-full bg-current" aria-hidden />
        {vm.label}
      </span>
      {vm.detail && <span className="hidden truncate sm:inline">{vm.detail}</span>}
      <span className="ml-auto whitespace-nowrap">{vm.lines} líneas · {vm.size}</span>
      <label className="flex items-center gap-1.5">
        <span className="hidden lg:inline">Sangría</span>
        <select
          value={vm.indent}
          onChange={(e) => vm.onIndentChange(e.target.value as IndentOption)}
          className="rounded border border-border bg-bg px-1 py-0.5 text-fg outline-none focus-visible:border-accent"
        >
          {INDENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </footer>
  );
}
