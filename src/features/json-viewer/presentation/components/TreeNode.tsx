"use client";

import { ChevronRight } from "lucide-react";
import { useTreeNode } from "../hooks/useTreeNode";
import type { TreeNodeVM } from "../utils/jsonTree";
import { KIND_CLASS } from "../utils/styles.constants";

interface TreeNodeProps {
  node: TreeNodeVM;
  openDepth: number;
}

function NodeLabel({ node }: { node: TreeNodeVM }) {
  if (node.label === null) return null;
  return <span className={node.labelIsIndex ? "text-gutter" : "text-tok-key"}>{node.label}</span>;
}

/** Objetos, arrays y grupos usan <details>/<summary>; sus hijos solo existen mientras están abiertos. */
export function TreeNode({ node, openDepth }: TreeNodeProps) {
  const vm = useTreeNode(node, openDepth);

  if (vm.isLeaf) {
    return (
      <div className="flex gap-1.5 py-px pl-[22px]">
        <NodeLabel node={node} />
        <span className={`break-all ${KIND_CLASS[node.kind as keyof typeof KIND_CLASS]}`}>{node.preview}</span>
      </div>
    );
  }

  return (
    <details open={vm.open} onToggle={vm.onToggle}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded py-px hover:bg-hover [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted transition-transform [details[open]>summary>&]:rotate-90" />
        <NodeLabel node={node} />
        <span className="text-muted">{node.preview}</span>
      </summary>
      {vm.open && (
        <div className="ml-2 border-l border-border pl-3">
          {vm.children.map((child) => (
            <TreeNode key={child.id} node={child} openDepth={openDepth} />
          ))}
        </div>
      )}
    </details>
  );
}
