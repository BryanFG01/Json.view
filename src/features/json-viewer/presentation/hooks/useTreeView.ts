"use client";

import { useMemo, useState } from "react";
import type { JsonParseResult } from "../../domain/models/json";
import { createRoot } from "../utils/jsonTree";

const DEFAULT_OPEN_DEPTH = 2;

export function useTreeView(parsed: JsonParseResult) {
  const [openDepth, setOpenDepth] = useState(DEFAULT_OPEN_DEPTH);
  // Cambiar la key remonta los nodos para que respeten el nuevo `open` inicial.
  const [version, setVersion] = useState(0);

  const root = useMemo(
    () => (parsed.status === "valid" ? createRoot(parsed.value, openDepth) : null),
    [parsed, openDepth],
  );

  const setDepth = (depth: number) => {
    setOpenDepth(depth);
    setVersion((v) => v + 1);
  };

  return {
    root,
    openDepth,
    treeKey: String(version),
    error: parsed.status === "invalid" ? parsed.error : null,
    isEmpty: parsed.status === "empty",
    // "Expandir todo" abre todos los niveles, pero en listas grandes solo el primer grupo de 100.
    expandAll: () => setDepth(Infinity),
    collapseAll: () => setDepth(1),
  };
}
