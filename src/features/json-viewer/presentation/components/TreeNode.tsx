import { ChevronRight } from "lucide-react";
import type { TreeNodeVM } from "../utils/jsonTree";
import { KIND_CLASS } from "../utils/styles.constants";

function NodeLabel({ node }: { node: TreeNodeVM }) {
  if (node.label === null) return null;
  return <span className={node.labelIsIndex ? "text-gutter" : "text-tok-key"}>{node.label}</span>;
}

/** Objetos y arrays usan <details>/<summary>: colapsar y expandir sin JavaScript extra. */
export function TreeNode({ node }: { node: TreeNodeVM }) {
  if (!node.children) {
    return (
      <div className="flex gap-1.5 py-px pl-[22px]">
        <NodeLabel node={node} />
        <span className={`break-all ${KIND_CLASS[node.kind]}`}>{node.preview}</span>
      </div>
    );
  }

  return (
    <details open={node.open}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded py-px hover:bg-hover [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted transition-transform [details[open]>summary>&]:rotate-90" />
        <NodeLabel node={node} />
        <span className="text-muted">{node.preview}</span>
      </summary>
      <div className="ml-2 border-l border-border pl-3">
        {node.children.map((child) => (
          <TreeNode key={child.id} node={child} />
        ))}
      </div>
    </details>
  );
}
