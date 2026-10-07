import { json } from "@codemirror/lang-json";
import { MariaSQL, MSSQL, MySQL, PLSQL, PostgreSQL, sql, SQLite, StandardSQL, type SQLDialect } from "@codemirror/lang-sql";
import { Compartment, type Extension } from "@codemirror/state";
import type { DocLanguage, SqlDialect } from "../../domain/models/json";

/** Compartimento del lenguaje: se reconfigura al pasar de JSON a SQL sin recrear el editor. */
export const languageCompartment = new Compartment();

const CM_DIALECTS: Record<SqlDialect, SQLDialect> = {
  sql: StandardSQL,
  postgresql: PostgreSQL,
  mysql: MySQL,
  mariadb: MariaSQL,
  tsql: MSSQL,
  plsql: PLSQL,
  sqlite: SQLite,
  bigquery: StandardSQL,
};

export function languageExtension(language: DocLanguage, dialect: SqlDialect): Extension {
  return language === "sql" ? sql({ dialect: CM_DIALECTS[dialect], upperCaseKeywords: true }) : json();
}
