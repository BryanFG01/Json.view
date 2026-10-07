"use client";

import { useEffect, useState } from "react";
import type { SqlDialect } from "../../domain/models/json";
import { formatSqlUseCase } from "../../application/useCases/formatSql";

interface SqlSide {
  text: string;
  dialect: SqlDialect;
}

interface Normalized {
  key: string;
  left: string;
  right: string;
}

const keyOf = (left: SqlSide, right: SqlSide) => `${left.dialect}\u0000${left.text}\u0000${right.dialect}\u0000${right.text}`;

/**
 * Formatea los dos lados de una comparación SQL (formateo asíncrono, en segundo plano) para
 * que el diff solo marque cambios reales y no espacios, saltos de línea o mayúsculas.
 * Devuelve null mientras no está listo o si está desactivado; si un lado no se puede
 * formatear, se usa su texto original.
 */
export function useSqlNormalized(active: boolean, left: SqlSide, right: SqlSide) {
  const [result, setResult] = useState<Normalized | null>(null);
  const key = keyOf(left, right);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    Promise.all([
      formatSqlUseCase(left.text, left.dialect, "2"),
      formatSqlUseCase(right.text, right.dialect, "2"),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setResult({ key, left: a.ok ? a.text : left.text, right: b.ok ? b.text : right.text });
    });
    return () => {
      cancelled = true;
    };
  }, [active, key, left.text, left.dialect, right.text, right.dialect]);

  return active && result?.key === key ? result : null;
}
