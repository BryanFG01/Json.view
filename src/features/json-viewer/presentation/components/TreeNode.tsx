"use client";

import { Check, ChevronRight, Copy } from "lucide-react";
import type { MouseEvent } from "react";
import { tipAttrs, type Tip } from "@/shared/tooltip/tip";
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

/** Visible al pasar el ratón o con foco; en pantallas táctiles (sin hover) siempre visible. */
function CopyButton({ tip, copied, onClick }: { tip: Tip; copied: boolean; onClick: (e: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tip.title}
      {...tipAttrs(tip)}
      className={`ml-1 grid size-5 shrink-0 place-items-center rounded hover:bg-hover focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100 ${copied ? "text-ok [@media(hover:hover)]:opacity-100" : "text-muted hover:text-fg"}`}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

/** Objetos, arrays y grupos usan <details>/<summary>; sus hijos solo existen mientras están abiertos. */
export function TreeNode({ node, openDepth }: TreeNodeProps) {
  const vm = useTreeNode(node, openDepth);
  const copyButton = <CopyButton tip={vm.copyTip} copied={vm.copied} onClick={vm.copy} />;

  if (vm.isLeaf) {
    return (
      <div className="group/row flex items-center gap-1.5 rounded py-px pl-[22px] hover:bg-hover/50">
        <NodeLabel node={node} />
        <span className={`break-all ${KIND_CLASS[node.kind as keyof typeof KIND_CLASS]}`}>{node.preview}</span>
        {copyButton}
      </div>
    );
  }

  return (
    <details open={vm.open} onToggle={vm.onToggle}>
      <summary className="group/row flex cursor-pointer list-none items-center gap-1.5 rounded py-px hover:bg-hover [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted transition-transform [details[open]>summary>&]:rotate-90" />
        <NodeLabel node={node} />
        <span className="text-muted">{node.preview}</span>
        {copyButton}
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
