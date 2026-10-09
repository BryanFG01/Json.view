// Web Worker: formatea SQL fuera del hilo principal para que la página no se congele con
// scripts grandes (≈4 s por MB). Usa el mismo use case que el resto de la app.
import type { IndentOption, SqlDialect } from "../../domain/models/json";
import { formatSqlUseCase } from "../../application/useCases/formatSql";

export interface SqlFormatRequest {
  id: number;
  text: string;
  dialect: SqlDialect;
  indent: IndentOption;
}

self.onmessage = async (event: MessageEvent<SqlFormatRequest>) => {
  const { id, text, dialect, indent } = event.data;
  const result = await formatSqlUseCase(text, dialect, indent);
  self.postMessage({ id, result });
};
