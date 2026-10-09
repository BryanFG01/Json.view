import { decodeTextUseCase, looksBinaryUseCase } from "./decodeText";
import { isSqliteBytes, isWalBytes } from "./sqliteFile";
import { extractZipUseCase, isZipBytes, type FileEntry } from "./zipFile";

/** Qué hacer con lo que se subió o arrastró. */
export type UploadPlan =
  | { kind: "sqlite"; name: string; db: Uint8Array; wal: Uint8Array | null }
  | { kind: "text"; name: string; text: string }
  | { kind: "error"; message: string };

/** Abre los .zip y devuelve todos los archivos sueltos. */
async function expandZips(files: FileEntry[]): Promise<FileEntry[]> {
  const expanded: FileEntry[] = [];
  for (const file of files) {
    if (isZipBytes(file.bytes)) expanded.push(...(await extractZipUseCase(file.bytes)));
    else expanded.push(file);
  }
  return expanded;
}

const fileLabel = (name: string) => name.split("/").pop() ?? name;

/**
 * Decide cómo abrir lo subido (uno o varios archivos, o un .zip):
 * base SQLite (con su -wal si viene) → texto (JSON / SQL / txt) → aviso si es otro binario.
 */
export async function classifyUploadUseCase(files: FileEntry[]): Promise<UploadPlan> {
  let entries: FileEntry[];
  try {
    entries = await expandZips(files);
  } catch {
    return { kind: "error", message: "No se pudo abrir el .zip: está dañado o usa un formato no soportado." };
  }
  if (entries.length === 0) return { kind: "error", message: "El .zip está vacío." };

  const database = entries.find((entry) => isSqliteBytes(entry.bytes));
  if (database) {
    const wal = entries.find((entry) => entry !== database && isWalBytes(entry.bytes)) ?? null;
    return { kind: "sqlite", name: fileLabel(database.name), db: database.bytes, wal: wal?.bytes ?? null };
  }
  if (entries.some((entry) => isWalBytes(entry.bytes))) {
    return { kind: "error", message: "Ese es el archivo -wal de una base SQLite: súbelo junto con su .db (selecciona los dos)." };
  }
  const textFile = entries.find((entry) => !looksBinaryUseCase(entry.bytes));
  if (textFile) return { kind: "text", name: fileLabel(textFile.name), text: decodeTextUseCase(textFile.bytes) };
  return {
    kind: "error",
    message: `"${fileLabel(entries[0].name)}" no es texto ni una base SQLite (¿base cifrada, backup .bak/.mdf o imagen?). Si es de SQL Server, exporta un script .sql.`,
  };
}
