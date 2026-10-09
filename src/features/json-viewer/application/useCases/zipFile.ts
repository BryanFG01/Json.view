// Lectura de .zip en el navegador sin dependencias: directorio central + DecompressionStream nativo.

export interface FileEntry {
  name: string;
  bytes: Uint8Array;
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
/** No se descomprime nada mayor que esto (protege de "zip bombs"). */
const MAX_ENTRY_BYTES = 500 * 1024 * 1024;

export function isZipBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

async function inflateRaw(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findEndOfCentralDirectory(view: DataView): number {
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65_557); i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i;
  }
  throw new Error("El .zip está dañado o incompleto.");
}

/** Archivos del .zip (sin carpetas ni metadatos de macOS). Soporta "stored" y "deflate". */
export async function extractZipUseCase(zip: Uint8Array): Promise<FileEntry[]> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const eocd = findEndOfCentralDirectory(view);
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries: FileEntry[] = [];
  const decoder = new TextDecoder();

  for (let i = 0; i < count && view.getUint32(offset, true) === CENTRAL_SIGNATURE; i++) {
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(zip.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;

    if (name.endsWith("/") || name.startsWith("__MACOSX/") || size > MAX_ENTRY_BYTES) continue;
    const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
    const data = zip.slice(dataStart, dataStart + compressedSize);
    if (method === 0) entries.push({ name, bytes: data });
    else if (method === 8) entries.push({ name, bytes: await inflateRaw(data) });
  }
  return entries;
}
