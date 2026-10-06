"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { KeyOrder } from "../../domain/models/json";
import { useJsonDiff, type JsonDiffProps } from "../hooks/useJsonDiff";
import { KEY_ORDER_OPTIONS } from "../utils/sortOptions.constants";
import { DiffCell } from "./DiffCell";

function Message({ children }: { children: ReactNode }) {
  return <p className="p-8 text-center text-sm text-muted">{children}</p>;
}

export function DiffView(props: JsonDiffProps) {
  const vm = useJsonDiff(props);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-panel px-3 py-1.5 text-sm">
        <span className="font-semibold">Diferencias</span>
        {vm.table && (
          <span className="font-mono text-xs">
            <span className="text-ok">+{vm.table.added}</span>{" "}
            <span className="text-err">−{vm.table.removed}</span> líneas
          </span>
        )}
        <select
          aria-label="Orden de las claves"
          value={vm.sort.keys}
          onChange={(e) => vm.setKeyOrder(e.target.value as KeyOrder)}
          className="rounded border border-border bg-bg px-1.5 py-0.5 text-xs text-fg outline-none focus-visible:border-accent"
        >
          {KEY_ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={vm.sort.arrays} onChange={vm.toggleSortArrays} className="accent-accent" />
          Ordenar arrays (1, 2, 10…)
        </label>
        {vm.comparesRawText && vm.hasBoth && (
          <span className="hidden text-xs text-err sm:inline">Uno de los JSON no es válido: se compara el texto tal cual</span>
        )}
        <button type="button" onClick={vm.onClose} className="ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted hover:bg-hover hover:text-fg">
          <X className="size-3.5" /> Salir <kbd className="rounded border border-border px-1 font-mono text-[10px]">Esc</kbd>
        </button>
      </div>

      {!vm.hasBoth && <Message>Escribe o pega un JSON en cada panel para compararlos. Pulsa Esc para volver.</Message>}
      {vm.isIdentical && <Message>Los dos JSON son idénticos.</Message>}

      {vm.table && !vm.isIdentical && (
        <div className="min-h-0 flex-1 overflow-auto py-2 font-mono text-[13px] leading-[21px]">
          {vm.table.rows.map((row) => (
            <div key={row.id} className="grid grid-cols-2 divide-x divide-border">
              <DiffCell cell={row.left} />
              <DiffCell cell={row.right} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
