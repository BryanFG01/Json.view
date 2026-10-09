// Decodifica archivos de texto con la codificación correcta. SSMS ("Generar scripts") guarda por
// defecto en UTF-16 con BOM; muchos .sql antiguos de Windows vienen en ANSI (Windows-1252).

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((byte, i) => bytes[i] === byte);
}

/** Sin BOM: si casi todos los bytes impares (o pares) son 0, es UTF-16 (texto latino). */
function guessUtf16(bytes: Uint8Array): "utf-16le" | "utf-16be" | null {
  const sample = Math.min(bytes.length - (bytes.length % 2), 4000);
  if (sample < 4) return null;
  let evenZeros = 0;
  let oddZeros = 0;
  for (let i = 0; i < sample; i += 2) {
    if (bytes[i] === 0) evenZeros++;
    if (bytes[i + 1] === 0) oddZeros++;
  }
  const pairs = sample / 2;
  if (oddZeros / pairs > 0.6 && evenZeros / pairs < 0.1) return "utf-16le";
  if (evenZeros / pairs > 0.6 && oddZeros / pairs < 0.1) return "utf-16be";
  return null;
}

/**
 * ¿Es un archivo binario (no texto)? Bytes nulo dispersos que no siguen el patrón de UTF-16.
 * Sirve para no cargar como texto ilegible un .bak, una base cifrada, una imagen…
 */
export function looksBinaryUseCase(bytes: Uint8Array): boolean {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf]) || startsWith(bytes, [0xff, 0xfe]) || startsWith(bytes, [0xfe, 0xff])) return false;
  if (guessUtf16(bytes)) return false;
  const sample = bytes.subarray(0, 8000);
  let controls = 0;
  // Caracteres de control que no aparecen en texto (se permiten \t \n \r y ESC).
  for (const byte of sample) if (byte < 9 || (byte > 13 && byte < 32 && byte !== 27)) controls++;
  return sample.length > 0 && controls / sample.length > 0.01;
}

/**
 * Bytes de un archivo → texto. Orden: BOM (UTF-8 / UTF-16 LE / BE), UTF-16 sin BOM,
 * UTF-8 estricto y, si no es UTF-8 válido, Windows-1252 (ANSI de Windows en español).
 */
export function decodeTextUseCase(bytes: Uint8Array): string {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) return new TextDecoder("utf-8").decode(bytes.subarray(3));
  if (startsWith(bytes, [0xff, 0xfe])) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (startsWith(bytes, [0xfe, 0xff])) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  const utf16 = guessUtf16(bytes);
  if (utf16) return new TextDecoder(utf16).decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
