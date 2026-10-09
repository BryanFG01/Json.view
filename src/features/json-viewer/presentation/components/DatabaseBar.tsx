"use client";

import { Database, FileCode2, Play, X } from "lucide-react";
import { tipAttrs } from "@/shared/tooltip/tip";
import type { useSqliteSource } from "../hooks/useSqliteSource";
import { TIPS } from "../utils/tooltips.constants";

type SqliteSourceVM = ReturnType<typeof useSqliteSource>;

/** Barra de la base SQLite abierta: tablas, consulta (Ctrl+Enter), esquema y cerrar. */
export function DatabaseBar({ vm }: { vm: SqliteSourceVM }) {
  return (
    <div role="region" aria-label="Base de datos SQLite" className="flex shrink-0 flex-col gap-1.5 border-b border-border bg-panel/60 px-2 py-1.5 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-fg">
          <Database className="size-4 shrink-0 text-accent" />
          <span className="truncate">{vm.summary}</span>
        </span>
        <select
          aria-label="Tabla o vista"
          {...tipAttrs(TIPS.dbTable)}
          value={vm.table}
          onChange={(e) => vm.selectTable(e.target.value)}
          className="min-w-0 max-w-64 rounded border border-border bg-bg px-1.5 py-0.5 text-fg outline-none focus-visible:border-accent"
        >
          {vm.table === "" && <option value="">Elige una tabla…</option>}
          {vm.objects.map((object) => (
            <option key={object.value} value={object.value}>{object.label}</option>
          ))}
        </select>
        <button type="button" onClick={vm.showSchema} {...tipAttrs(TIPS.dbSchema)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted hover:bg-hover hover:text-fg">
          <FileCode2 className="size-3.5" /> Esquema
        </button>
        <button type="button" onClick={vm.close} aria-label="Cerrar base" {...tipAttrs(TIPS.dbClose)} className="ml-auto grid size-6 place-items-center rounded text-muted hover:bg-hover hover:text-fg">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex items-start gap-1.5">
        <textarea
          aria-label="Consulta SQL"
          value={vm.query}
          onChange={(e) => vm.setQuery(e.target.value)}
          onKeyDown={vm.onQueryKeyDown}
          rows={2}
          spellCheck={false}
          placeholder="SELECT * FROM tabla WHERE … (Ctrl+Enter para ejecutar)"
          className="min-w-0 flex-1 resize-y rounded border border-border bg-bg px-2 py-1 font-mono text-[12px] text-fg outline-none focus-visible:border-accent"
        />
        <button type="button" onClick={vm.runQuery} {...tipAttrs(TIPS.dbRun)} className="flex items-center gap-1 rounded bg-accent px-2.5 py-1.5 font-semibold text-white hover:opacity-90">
          <Play className="size-3.5" /> Ejecutar
        </button>
      </div>
      {vm.result && <p role="status" className={vm.result.tone === "error" ? "text-err" : "text-muted"}>{vm.result.text}</p>}
      {vm.wal && <p className={vm.wal.tone === "warn" ? "text-tok-keyword" : "text-ok"}>{vm.wal.text}</p>}
    </div>
  );
}
