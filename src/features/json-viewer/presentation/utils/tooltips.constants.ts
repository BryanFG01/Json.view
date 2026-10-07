import type { Tip } from "@/shared/tooltip/tip";

const NEEDS_VALID = "Necesita un JSON válido en el panel.";
const NEEDS_TEXT = "El panel está vacío.";

/** Textos de los tooltips: qué hace cada control, su atajo y por qué está desactivado. */
export const TIPS = {
  editor: { title: "Editor", desc: "Edita el JSON como texto, con colores, numeración y plegado." },
  tree: { title: "Árbol", desc: "Explora la estructura: abre y cierra nodos y copia cualquier parte." },
  langJson: { title: "Modo JSON", desc: "Valida, formatea, ordena y explora el contenido como JSON." },
  langSql: {
    title: "Modo SQL",
    desc: "Trata el contenido como una consulta SQL: colores de SQL y Formatear según el dialecto. Se activa solo al pegar SQL.",
  },
  dialect: { title: "Dialecto SQL", desc: "Ajusta el formateo a la sintaxis de tu base de datos (comillas, LIMIT/TOP, etc.)." },
  sample: { title: "Cargar ejemplo", desc: "Carga un JSON de ejemplo para probar las herramientas." },
  upload: { title: "Subir archivo", desc: "Abre un .json o .txt de tu equipo. También puedes arrastrarlo al editor." },
  download: { title: "Descargar", desc: "Guarda el contenido del panel como data.json.", disabledHint: NEEDS_TEXT },
  copy: { title: "Copiar", desc: "Copia todo el contenido del panel.", disabledHint: NEEDS_TEXT },
  share: {
    title: "Copiar enlace para compartir",
    desc: "Crea un enlace con el JSON comprimido dentro de la URL. No se envía a ningún servidor.",
    disabledHint: NEEDS_TEXT,
  },
  search: {
    title: "Buscar",
    desc: "Busca dentro de este panel; con la pantalla dividida, cada panel tiene su propio buscador. Ctrl+H para reemplazar.",
    keys: "Ctrl+F",
  },
  format: { title: "Formatear", desc: "Indenta el JSON con la sangría elegida.", keys: "Shift+Alt+F", disabledHint: NEEDS_VALID },
  expandNested: {
    title: "Analizar JSON anidado",
    desc: 'Convierte en objetos los textos que contienen JSON (p. ej. "{\\"a\\":1}") y formatea.',
    disabledHint: NEEDS_VALID,
  },
  sort: {
    title: "Ordenar",
    desc: "Ordena claves (A→Z, Z→A), valores de arrays (1, 2, 10…) o arrays de objetos por un campo, en todos los niveles. Puede aplicarse solo al bloque del cursor.",
    disabledHint: NEEDS_VALID,
  },
  minify: { title: "Minificar", desc: "Quita espacios y saltos de línea: todo el JSON en una sola línea.", disabledHint: NEEDS_VALID },
  escape: {
    title: "Escapar como string",
    desc: "Convierte el JSON en un texto con comillas escapadas, para pegarlo dentro de otro JSON o en código.",
    disabledHint: NEEDS_VALID,
  },
  unescape: {
    title: "Desescapar string a JSON",
    desc: "Si el contenido es un texto con JSON dentro, lo vuelve a convertir en objeto.",
    disabledHint: "Solo se activa cuando el contenido es un string que contiene JSON.",
  },
  clear: { title: "Limpiar", desc: "Borra todo el contenido del panel. Se puede deshacer.", disabledHint: NEEDS_TEXT },
  undo: { title: "Deshacer", desc: "Vuelve al estado anterior del panel.", keys: "Ctrl+Z", disabledHint: "No hay nada que deshacer." },
  redo: { title: "Rehacer", desc: "Repite lo que deshiciste.", keys: "Ctrl+Y", disabledHint: "No hay nada que rehacer." },
  split: { title: "Dividir pantalla", desc: "Abre un segundo panel para trabajar con dos JSON a la vez." },
  compare: { title: "Comparar", desc: "Muestra las diferencias línea a línea entre el panel izquierdo y el derecho.", keys: "Esc para salir" },
  theme: { title: "Cambiar tema", desc: "Alterna entre tema claro y oscuro. Se recuerda para la próxima vez." },
  expandAll: { title: "Expandir todo", desc: "Abre todos los niveles del árbol (en listas grandes, el primer grupo de 100)." },
  collapseAll: { title: "Colapsar todo", desc: "Cierra todos los nodos y deja solo el primer nivel." },
  copyBlock: { title: "Copiar bloque", desc: "Copia solo el { } o [ ] donde está el cursor, ya formateado." },
  scope: { title: "Bloque del cursor", desc: "Líneas donde abre y cierra el bloque actual.", keys: "Ctrl+Shift+\\ salta a la pareja" },
  indent: { title: "Sangría", desc: "Espacios de indentación al formatear. Si el JSON es válido, se reformatea al cambiarla." },
  exitDiff: { title: "Salir de Comparar", desc: "Vuelve a los editores.", keys: "Esc" },
  diffKeyOrder: { title: "Orden de las claves", desc: "Ordena las claves de ambos lados antes de comparar. No cambia tus textos." },
  diffNormalizeSql: {
    title: "Normalizar formato SQL",
    desc: "Formatea las dos consultas igual antes de comparar: así solo se marcan los cambios reales, no espacios, saltos de línea ni mayúsculas.",
  },
  diffArrays: { title: "Ordenar arrays", desc: "Ordena los valores de los arrays de ambos lados antes de comparar." },
} satisfies Record<string, Tip>;

/** Tooltip del botón de copiar de una fila del árbol. */
export const treeCopyTip = (label: string): Tip => ({
  title: label,
  desc: "Objetos y arrays se copian como JSON formateado; los textos, sin comillas.",
});
