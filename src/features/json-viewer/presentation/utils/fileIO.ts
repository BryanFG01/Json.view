import type { DocLanguage } from "../../domain/models/json";

/**
 * JSON, scripts SQL (SSMS / mysqldump / pg_dump), texto plano, bases SQLite (Flutter/sqflite,
 * Drift, Android: .db, .sqlite…, con su -wal) y .zip que contengan cualquiera de ellos.
 */
export const ACCEPTED_FILES = [
  ".json", ".sql", ".ddl", ".dml", ".pgsql", ".psql", ".txt",
  ".db", ".sqlite", ".sqlite3", ".db3", ".db-wal", ".sqlite-wal", ".zip",
  "application/json", "application/sql", "text/plain", "application/zip", "application/x-sqlite3", "application/vnd.sqlite3",
].join(",");

const DOWNLOAD: Record<DocLanguage, { filename: string; type: string }> = {
  json: { filename: "data.json", type: "application/json" },
  sql: { filename: "consulta.sql", type: "application/sql" },
};

export function downloadText(language: DocLanguage, text: string): void {
  const { filename, type } = DOWNLOAD[language];
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
