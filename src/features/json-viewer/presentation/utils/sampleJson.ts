export const SAMPLE_JSON = JSON.stringify(
  {
    proyecto: "JSON Viewer",
    version: 1.2,
    publico: true,
    licencia: null,
    autor: { nombre: "Ada Lovelace", email: "ada@example.com" },
    etiquetas: ["json", "formatter", "validator"],
    caracteristicas: [
      { nombre: "Validar", activo: true, prioridad: 1 },
      { nombre: "Formatear", activo: true, prioridad: 2 },
      { nombre: "Árbol", activo: true, prioridad: 3 },
    ],
    estadisticas: { usuarios: 15230, ratio: 0.987, crecimiento: -2.5e-3 },
  },
  null,
  2,
);
