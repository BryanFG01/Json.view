"use client";

import { ArrowDownAZ } from "lucide-react";
import type { ReactNode } from "react";
import type { Tip } from "@/shared/tooltip/tip";
import type { SortOptions, SortTarget } from "../../domain/models/json";
import { useSortMenu, type SortContext } from "../hooks/useSortMenu";
import { SORT_PRESETS } from "../utils/sortOptions.constants";
import { ToolbarButton } from "./ToolbarButton";

interface SortMenuProps {
  tip: Tip;
  disabled: boolean;
  onSort: (options: SortOptions, target: SortTarget) => void;
  context: SortContext;
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="border-t border-border py-1 first:border-t-0">
    <p className="px-3 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</p>
    {children}
  </div>
);

const Radio = ({ checked, disabled, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: () => void }) => (
  <label className={`flex items-center gap-2 px-3 py-1 text-sm ${disabled ? "opacity-40" : "cursor-pointer hover:bg-hover"}`}>
    <input type="radio" name="sort-target" checked={checked} disabled={disabled} onChange={onChange} className="accent-accent" />
    {label}
  </label>
);

export function SortMenu({ tip, disabled, onSort, context }: SortMenuProps) {
  const menu = useSortMenu(onSort, context);

  return (
    <>
      <ToolbarButton icon={ArrowDownAZ} tip={tip} onClick={menu.toggle} disabled={disabled} active={menu.isOpen} />
      {menu.isOpen && (
        <>
          <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={menu.close} />
          <div role="menu" aria-label="Ordenar JSON" style={menu.menuStyle} className="fixed z-30 overflow-y-auto rounded-lg border border-border bg-panel py-1 shadow-xl">
            <Section title="Aplicar a">
              <Radio label="Todo el JSON" checked={menu.target === "all"} onChange={() => menu.setTarget("all")} />
              <Radio
                label={menu.blockLabel ? `Solo el bloque del cursor (${menu.blockLabel})` : "Solo el bloque del cursor (pon el cursor en un { } o [ ])"}
                checked={menu.target === "block"}
                disabled={!menu.blockLabel}
                onChange={() => menu.setTarget("block")}
              />
            </Section>
            <Section title="Claves y valores">
              {SORT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  role="menuitem"
                  onClick={() => menu.choose(preset.options)}
                  className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
                >
                  <span className="text-sm text-fg">{preset.label}</span>
                  <span className="text-xs text-muted">{preset.hint}</span>
                </button>
              ))}
            </Section>
            <Section title="Arrays de objetos por campo">
              {menu.fields.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-muted">No hay arrays de objetos en este JSON.</p>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <select
                    aria-label="Campo para ordenar"
                    value={menu.field}
                    onChange={(e) => menu.setField(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-border bg-bg px-1.5 py-1 text-sm text-fg outline-none focus-visible:border-accent"
                  >
                    {menu.fields.map((field) => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={menu.desc ? "Descendente" : "Ascendente"}
                    onClick={() => menu.setDesc(!menu.desc)}
                    className="rounded border border-border px-2 py-1 text-xs font-semibold text-fg hover:bg-hover"
                  >
                    {menu.desc ? "Z → A ↓" : "A → Z ↑"}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={menu.sortByField}
                    className="rounded bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Ordenar
                  </button>
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </>
  );
}
