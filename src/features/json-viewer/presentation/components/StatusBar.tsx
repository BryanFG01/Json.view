import { Check, Copy, Loader2 } from "lucide-react";
import type { IndentOption, SqlDialect } from "../../domain/models/json";
import { SQL_DIALECTS } from "../utils/sqlOptions.constants";
import type { JsonDocumentVM } from "../hooks/useJsonDocument";
import { INDENT_OPTIONS } from "../utils/options.constants";
import { TONE_CLASS } from "../utils/styles.constants";
import { TIPS } from "../utils/tooltips.constants";
import { tipAttrs } from "@/shared/tooltip/tip";

export function StatusBar({ vm }: { vm: JsonDocumentVM["status"] }) {
  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-border bg-panel px-3 text-xs text-muted">
      <span className={`flex shrink-0 items-center gap-1.5 font-semibold ${TONE_CLASS[vm.tone]}`}>
        <span className="size-2 rounded-full bg-current" aria-hidden />
        {vm.label}
      </span>
      {vm.formatting && (
        <span role="status" className="flex shrink-0 items-center gap-1.5 text-accent">
          <Loader2 className="size-3.5 animate-spin" /> Formateando SQL…
          <button type="button" onClick={vm.cancelFormatting} className="rounded px-1.5 py-0.5 font-semibold text-fg hover:bg-hover">
            Cancelar
          </button>
        </span>
      )}
      {vm.formatting ? null : vm.scopeLabel ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-accent" {...tipAttrs(TIPS.scope)}>{vm.scopeLabel}</span>
          <button
            type="button"
            onClick={vm.copyBlock}
            aria-label={TIPS.copyBlock.title}
            {...tipAttrs(TIPS.copyBlock)}
            className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-semibold hover:bg-hover ${vm.blockCopied ? "text-ok" : "text-fg"}`}
          >
            {vm.blockCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{vm.blockCopied ? "Copiado" : "Copiar bloque"}</span>
          </button>
        </span>
      ) : (
        vm.detail && <span className="hidden truncate sm:inline">{vm.detail}</span>
      )}
      <span className="ml-auto whitespace-nowrap">{vm.lines} líneas · {vm.size}</span>
      {vm.isSql && (
        <select
          aria-label={TIPS.dialect.title}
          {...tipAttrs(TIPS.dialect)}
          value={vm.dialect}
          onChange={(e) => vm.onDialectChange(e.target.value as SqlDialect)}
          className="max-w-36 rounded border border-border bg-bg px-1 py-0.5 text-fg outline-none focus-visible:border-accent"
        >
          {SQL_DIALECTS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}
      <label className="flex items-center gap-1.5" {...tipAttrs(TIPS.indent)}>
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
