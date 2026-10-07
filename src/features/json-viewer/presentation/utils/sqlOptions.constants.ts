import type { SqlDialect } from "../../domain/models/json";

export const SQL_DIALECTS: { value: SqlDialect; label: string }[] = [
  { value: "sql", label: "SQL estándar" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "tsql", label: "SQL Server" },
  { value: "plsql", label: "Oracle (PL/SQL)" },
  { value: "sqlite", label: "SQLite" },
  { value: "bigquery", label: "BigQuery" },
];

export const dialectLabel = (dialect: SqlDialect) =>
  SQL_DIALECTS.find((option) => option.value === dialect)?.label ?? dialect;

/** Ejemplo para el botón "Cargar ejemplo" en modo SQL. */
export const SAMPLE_SQL =
  "select c.id, c.nombre, count(p.id) as pedidos, sum(p.total) as total from clientes c " +
  "left join pedidos p on p.cliente_id = c.id where c.activo = 1 and p.fecha >= '2026-01-01' " +
  "group by c.id, c.nombre having count(p.id) > 2 order by total desc limit 10;";
