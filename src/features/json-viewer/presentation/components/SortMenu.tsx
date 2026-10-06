"use client";

import { ArrowDownAZ } from "lucide-react";
import type { SortOptions } from "../../domain/models/json";
import { useSortMenu } from "../hooks/useSortMenu";
import { SORT_PRESETS } from "../utils/sortOptions.constants";
import { TIPS } from "../utils/tooltips.constants";
import { ToolbarButton } from "./ToolbarButton";

interface SortMenuProps {
  disabled: boolean;
  onSort: (options: SortOptions) => void;
}

export function SortMenu({ disabled, onSort }: SortMenuProps) {
  const menu = useSortMenu(onSort);

  return (
    <>
      <ToolbarButton icon={ArrowDownAZ} tip={TIPS.sort} onClick={menu.toggle} disabled={disabled} active={menu.isOpen} />
      {menu.isOpen && (
        <>
          <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-20 cursor-default" onClick={menu.close} />
          <div role="menu" aria-label="Ordenar JSON" style={menu.menuStyle} className="fixed z-30 rounded-lg border border-border bg-panel py-1 shadow-xl">
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
          </div>
        </>
      )}
    </>
  );
}
