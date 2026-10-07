import { TIPS } from "./tooltips.constants";

const JSON_ONLY = "Solo disponible en modo JSON.";

const SQL_TIPS = {
  ...TIPS,
  sample: { ...TIPS.sample, desc: "Carga una consulta SQL de ejemplo para probar el formateo." },
  download: { ...TIPS.download, desc: "Guarda la consulta como consulta.sql." },
  format: {
    ...TIPS.format,
    title: "Formatear",
    desc: "Formatea la consulta SQL: una cláusula por línea, palabras clave en MAYÚSCULAS y la sangría elegida.",
    disabledHint: "Escribe o pega una consulta para formatearla.",
  },
  expandNested: { ...TIPS.expandNested, disabledHint: JSON_ONLY },
  sort: { ...TIPS.sort, disabledHint: JSON_ONLY },
  minify: {
    ...TIPS.minify,
    title: "Minificar",
    desc: "Deja la consulta en una sola línea. Respeta los textos entre comillas; los comentarios -- pasan a /* */.",
    disabledHint: "Escribe o pega una consulta.",
  },
  escape: {
    ...TIPS.escape,
    title: "Escapar como texto SQL",
    desc: "Envuelve la consulta en comillas simples '…' duplicando las internas (' → ''), lista para un INSERT … VALUES ('…').",
    disabledHint: "Escribe o pega una consulta.",
  },
  unescape: {
    ...TIPS.unescape,
    title: "Desescapar texto",
    desc: "Quita las comillas de un texto '…' (o \"…\") y restaura las comillas internas.",
    disabledHint: "Solo se activa cuando el contenido es un texto entre comillas '…' o \"…\".",
  },
  tree: { ...TIPS.tree, disabledHint: JSON_ONLY },
};

/** Tooltips de la barra según el modo del panel: en SQL explican qué hace cada botón con SQL. */
export function toolbarTips(isSql: boolean) {
  return isSql ? SQL_TIPS : TIPS;
}

export type ToolbarTips = ReturnType<typeof toolbarTips>;
