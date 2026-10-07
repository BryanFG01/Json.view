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
  minify: { ...TIPS.minify, disabledHint: JSON_ONLY },
  escape: { ...TIPS.escape, disabledHint: JSON_ONLY },
  unescape: { ...TIPS.unescape, disabledHint: JSON_ONLY },
  tree: { ...TIPS.tree, disabledHint: JSON_ONLY },
};

/** Tooltips de la barra según el modo del panel: en SQL explican qué hace cada botón con SQL. */
export function toolbarTips(isSql: boolean) {
  return isSql ? SQL_TIPS : TIPS;
}

export type ToolbarTips = ReturnType<typeof toolbarTips>;
