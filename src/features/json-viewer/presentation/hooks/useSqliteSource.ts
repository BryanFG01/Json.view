"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JsonValue } from "../../domain/models/json";
import type { ISqliteDatabase, SqliteInfo } from "../../domain/models/sqlite";
import { classifyUploadUseCase } from "../../application/useCases/classifyUpload";
import type { FileEntry } from "../../application/useCases/zipFile";
import { openSqliteDatabase } from "../../infrastructure/sqlite/sqlJsDatabase";
import { databaseSummary, describeQueryResult, objectLabel, QUERY_MAX_ROWS, tableQuery, walNotice } from "../utils/sqliteView";

interface SqliteSourceParams {
  /** Texto subido (JSON / SQL / txt): lo carga el documento como siempre. */
  loadText: (text: string, fileName: string) => void;
  showJson: (value: JsonValue) => void;
  showSql: (sql: string) => void;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
/** Referencia estable cuando no hay base (evita recalcular el esquema del autocompletado). */
const EMPTY_OBJECTS: SqliteInfo["objects"] = [];

/**
 * Subidas del panel y base SQLite abierta (Flutter/sqflite, Drift, Android…). Las tablas y
 * consultas se muestran como JSON en el editor del panel: sirven Árbol, Ordenar, Comparar…
 */
export function useSqliteSource({ loadText, showJson, showSql }: SqliteSourceParams) {
  const dbRef = useRef<ISqliteDatabase | null>(null);
  const [info, setInfo] = useState<SqliteInfo | null>(null);
  const [query, setQuery] = useState("");
  const [table, setTable] = useState("");
  const [result, setResult] = useState<{ text: string; tone: "info" | "error" } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => () => dbRef.current?.close(), []);

  const run = useCallback((sql: string) => {
    const db = dbRef.current;
    if (!db || !sql.trim()) return;
    try {
      const output = db.query(sql, QUERY_MAX_ROWS);
      if (output.columns.length > 0) showJson(output.rows);
      setResult({ text: describeQueryResult(output), tone: "info" });
    } catch (error) {
      setResult({ text: `Error de SQL: ${message(error)}`, tone: "error" });
    }
  }, [showJson]);

  const selectTable = useCallback((name: string) => {
    const sql = tableQuery(name);
    setTable(name);
    setQuery(sql);
    run(sql);
  }, [run]);

  const openDatabase = async (name: string, bytes: Uint8Array, wal: Uint8Array | null) => {
    setOpening(true);
    try {
      const db = await openSqliteDatabase(name, bytes, wal);
      dbRef.current?.close();
      dbRef.current = db;
      setInfo(db.info());
      const objects = db.info().objects;
      const first = objects.find((o) => o.type === "table" && o.name !== "android_metadata") ?? objects[0];
      if (first) selectTable(first.name);
      else setResult({ text: "La base no tiene tablas.", tone: "info" });
    } catch (error) {
      setNotice(`No se pudo abrir la base: ${message(error)}`);
    } finally {
      setOpening(false);
    }
  };

  const handleFiles = async (files: FileEntry[]) => {
    setNotice(null);
    const plan = await classifyUploadUseCase(files);
    if (plan.kind === "error") setNotice(plan.message);
    else if (plan.kind === "text") loadText(plan.text, plan.name);
    else await openDatabase(plan.name, plan.db, plan.wal);
  };

  return {
    handleFiles,
    opening,
    notice,
    dismissNotice: () => setNotice(null),
    isOpen: info !== null,
    summary: info ? databaseSummary(info) : "",
    wal: info ? walNotice(info) : null,
    objects: (info?.objects ?? []).map((o) => ({ value: o.name, label: objectLabel(o) })),
    table,
    selectTable,
    /** Tablas y vistas con sus columnas: alimentan el autocompletado de la consulta. */
    schemaObjects: info?.objects ?? EMPTY_OBJECTS,
    query,
    setQuery,
    result,
    runQuery: () => run(query),
    /** Ctrl+Enter desde el editor de la consulta: ejecuta exactamente lo escrito. */
    runSql: (sql: string) => {
      setQuery(sql);
      run(sql);
    },
    showSchema: () => {
      if (dbRef.current) showSql(dbRef.current.schema());
    },
    close: () => {
      dbRef.current?.close();
      dbRef.current = null;
      setInfo(null);
      setResult(null);
      setTable("");
    },
  };
}
