"use client";

import { useCallback, useState } from "react";
import type { DocLanguage, IndentOption, SqlDialect } from "../../domain/models/json";
import { guessSqlDialect } from "../../application/useCases/detectSqlDialect";
import { formatSqlUseCase } from "../../application/useCases/formatSql";
import { fromSqlLiteralUseCase, minifySqlUseCase, toSqlLiteralUseCase } from "../../application/useCases/sqlText";

interface SqlModeParams {
  text: string;
  indent: IndentOption;
  replace: (text: string) => void;
}

interface FormatOptions {
  source?: string;
  indent?: IndentOption;
  dialect?: SqlDialect;
  /** Si no se puede formatear, deja el texto original igualmente (al pegar o subir). */
  keepOnError?: boolean;
}

/** Modo de lenguaje de un panel (JSON / SQL), dialecto y formateo de SQL. */
export function useSqlMode({ text, indent, replace }: SqlModeParams) {
  const [language, setLanguage] = useState<DocLanguage>("json");
  const [dialect, setDialectState] = useState<SqlDialect>("sql");
  /** El usuario eligió el dialecto a mano: ya no se cambia solo. */
  const [manualDialect, setManualDialect] = useState(false);
  /** El dialecto actual se detectó automáticamente (se indica en la barra de estado). */
  const [detected, setDetected] = useState(false);
  // El error se guarda junto al texto que lo produjo: al editar, deja de mostrarse solo.
  const [failure, setFailure] = useState<{ message: string; forText: string } | null>(null);

  const formatSql = useCallback(async (options: FormatOptions = {}) => {
    const source = options.source ?? text;
    if (!source.trim()) return;
    // Sin elección manual, se parte del dialecto que sugiere la propia consulta (@var → SQL Server…).
    const preferred = options.dialect ?? (manualDialect ? dialect : (guessSqlDialect(source) ?? dialect));
    const result = await formatSqlUseCase(source, preferred, options.indent ?? indent);
    if (result.ok) {
      setFailure(null);
      if (result.dialect !== dialect) {
        setDialectState(result.dialect);
        setDetected(true);
      }
      replace(result.text);
      return;
    }
    if (options.keepOnError) replace(source);
    setFailure({ message: result.message, forText: source });
  }, [text, dialect, manualDialect, indent, replace]);

  const setDialect = (next: SqlDialect) => {
    setDialectState(next);
    setManualDialect(true);
    setDetected(false);
    void formatSql({ dialect: next });
  };

  const unescaped = language === "sql" ? fromSqlLiteralUseCase(text) : null;

  return {
    language,
    isSql: language === "sql",
    setLanguage,
    dialect,
    dialectDetected: detected,
    setDialect,
    formatSql,
    sqlError: failure && failure.forText === text ? failure.message : null,
    /** Acciones de la barra equivalentes a las de JSON, aplicadas a la consulta. */
    actions: {
      minify: () => replace(minifySqlUseCase(text)),
      escape: () => replace(toSqlLiteralUseCase(text)),
      unescape: () => {
        if (unescaped !== null) replace(unescaped);
      },
      canUnescape: unescaped !== null,
    },
  };
}
