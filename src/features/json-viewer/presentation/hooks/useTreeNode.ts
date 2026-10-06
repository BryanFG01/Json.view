"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import { childrenOf, type TreeNodeVM } from "../utils/jsonTree";

/** Estado de un nodo del árbol: los hijos solo se calculan (y se pintan) mientras está abierto. */
export function useTreeNode(node: TreeNodeVM, openDepth: number) {
  const [open, setOpen] = useState(node.defaultOpen);
  const children = useMemo(() => (open ? childrenOf(node, openDepth) : []), [open, node, openDepth]);

  return {
    open,
    children,
    isLeaf: node.source === null,
    onToggle: (event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open),
  };
}
