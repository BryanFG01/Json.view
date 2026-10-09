/**
 * Une un texto cualquiera en una sola línea: quita los saltos de línea, la sangría de cada línea
 * y las líneas vacías, separando lo que eran líneas con un espacio. Para texto que no es JSON
 * válido (en JSON válido se usa la minificación de JSON, que conserva los valores exactos).
 */
export function joinLinesUseCase(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}
