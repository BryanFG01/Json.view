"use client";

import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { JsonParseResult } from "../../domain/models/json";
import { useTreeView } from "../hooks/useTreeView";
import { ErrorBanner } from "./ErrorBanner";
import { ToolbarButton } from "./ToolbarButton";
import { TreeNode } from "./TreeNode";

export function TreeView({ parsed }: { parsed: JsonParseResult }) {
  const vm = useTreeView(parsed);

  if (vm.error) {
    return (
      <div className="flex h-full flex-col">
        <ErrorBanner error={vm.error} />
        <p className="p-6 text-sm text-muted">Corrige el JSON en la pestaña Editor para ver el árbol.</p>
      </div>
    );
  }

  if (!vm.root) {
    return <p className="p-6 text-sm text-muted">No hay JSON todavía. Escríbelo en el Editor o sube un archivo.</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-0.5">
        <ToolbarButton icon={ChevronsUpDown} label="Expandir todo" onClick={vm.expandAll} />
        <ToolbarButton icon={ChevronsDownUp} label="Colapsar todo" onClick={vm.collapseAll} />
      </div>
      <div key={vm.treeKey} className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[14px] leading-[22px]">
        <TreeNode node={vm.root} openDepth={vm.openDepth} />
      </div>
    </div>
  );
}
