"use client";

import { useMemo, useState, type MouseEvent, type SyntheticEvent } from "react";
import { childrenOf, type TreeNodeVM } from "../utils/jsonTree";
import { treeCopyTip } from "../utils/tooltips.constants";
import { nodeCopyLabel, nodeCopyText } from "../utils/treeCopy";
import { useClipboard } from "./useClipboard";

/** Estado de un nodo del árbol: los hijos solo se calculan (y se pintan) mientras está abierto. */
export function useTreeNode(node: TreeNodeVM, openDepth: number) {
  const [open, setOpen] = useState(node.defaultOpen);
  const children = useMemo(() => (open ? childrenOf(node, openDepth) : []), [open, node, openDepth]);
  const clipboard = useClipboard();

  return {
    open,
    children,
    isLeaf: node.source === null,
    onToggle: (event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open),
    copied: clipboard.copied,
    copyTip: treeCopyTip(nodeCopyLabel(node)),
    // El botón vive dentro de <summary>: sin preventDefault, copiar también abriría/cerraría el nodo.
    copy: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void clipboard.copy(nodeCopyText(node));
    },
  };
}
