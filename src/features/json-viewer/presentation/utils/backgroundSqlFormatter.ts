import type { IndentOption, SqlDialect } from "../../domain/models/json";
import { formatSqlUseCase, type SqlFormatResult } from "../../application/useCases/formatSql";

export type BackgroundFormatResult = SqlFormatResult | { ok: false; cancelled: true; message: string };

/**
 * Formateador de SQL en un Web Worker propio (uno por panel: cancelar en uno no afecta al otro).
 * El worker se crea al primer uso; cancelar lo termina y el siguiente formateo crea otro.
 */
export class BackgroundSqlFormatter {
  private worker: Worker | null = null;
  private nextId = 0;
  private pending = new Map<number, (result: BackgroundFormatResult) => void>();

  format(text: string, dialect: SqlDialect, indent: IndentOption): Promise<BackgroundFormatResult> {
    if (typeof Worker === "undefined") return formatSqlUseCase(text, dialect, indent);
    return new Promise((resolve) => {
      const id = ++this.nextId;
      this.pending.set(id, resolve);
      this.getWorker().postMessage({ id, text, dialect, indent });
    });
  }

  /** Detiene el formateo en curso (la consulta queda como estaba). */
  cancel(): void {
    this.worker?.terminate();
    this.worker = null;
    for (const resolve of this.pending.values()) resolve({ ok: false, cancelled: true, message: "Cancelado" });
    this.pending.clear();
  }

  dispose(): void {
    this.cancel();
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("../workers/sqlFormat.worker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (event: MessageEvent<{ id: number; result: SqlFormatResult }>) => {
        this.pending.get(event.data.id)?.(event.data.result);
        this.pending.delete(event.data.id);
      };
    }
    return this.worker;
  }
}
