import { EditorView } from "@codemirror/view";

// Estilos de la barra de búsqueda (cmSearchPanel.ts) y de las coincidencias en el texto.
const mix = (color: string, percent: number) => `color-mix(in srgb, var(${color}) ${percent}%, transparent)`;

export const searchTheme = EditorView.theme({
  ".cm-panels": { backgroundColor: "var(--panel)", color: "var(--fg)" },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--border)" },
  ".cm-jv-search": { display: "flex", flexDirection: "column", gap: "4px", padding: "6px 8px", fontFamily: "var(--font-geist-sans), system-ui, sans-serif", fontSize: "12px" },
  ".cm-jv-row": { display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap" },
  ".cm-jv-row[hidden]": { display: "none" },
  ".cm-jv-input": {
    flex: "1 1 160px",
    minWidth: "0",
    height: "28px",
    padding: "0 8px",
    marginRight: "4px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg)",
    color: "var(--fg)",
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    fontSize: "13px",
    outline: "none",
  },
  ".cm-jv-input:focus": { borderColor: "var(--accent)", boxShadow: `0 0 0 2px ${mix("--accent", 25)}` },
  ".cm-jv-count": { minWidth: "84px", padding: "0 6px", color: "var(--muted)", whiteSpace: "nowrap", textAlign: "right" },
  ".cm-jv-count.is-empty": { color: "var(--err)" },
  ".cm-jv-btn": {
    height: "28px",
    minWidth: "28px",
    padding: "0 6px",
    borderRadius: "6px",
    border: "1px solid transparent",
    backgroundColor: "transparent",
    color: "var(--muted)",
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    fontSize: "13px",
    cursor: "pointer",
  },
  ".cm-jv-btn:hover": { backgroundColor: "var(--hover)", color: "var(--fg)" },
  ".cm-jv-btn:focus-visible": { outline: "2px solid var(--accent)", outlineOffset: "-2px" },
  ".cm-jv-toggle[aria-pressed=true]": { backgroundColor: mix("--accent", 22), borderColor: mix("--accent", 60), color: "var(--fg)" },
  ".cm-jv-text": { fontFamily: "var(--font-geist-sans), system-ui, sans-serif", fontSize: "12px", fontWeight: "600", color: "var(--fg)" },
  // Coincidencias: todas en tono suave, la actual en intenso.
  ".cm-searchMatch": { backgroundColor: mix("--tok-keyword", 28), outline: `1px solid ${mix("--tok-keyword", 55)}`, borderRadius: "2px" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: mix("--tok-keyword", 60), outline: "1px solid var(--tok-keyword)" },
  ".cm-selectionMatch": { backgroundColor: mix("--accent", 18) },
});
