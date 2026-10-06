# Estado del frontend — JSON Viewer

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react.
Arquitectura: `src/features/<feature>/{domain,application,presentation}` — los `.tsx` solo renderizan.

## Feature `json-viewer`

| Capa | Archivo | Responsabilidad |
|---|---|---|
| domain | `models/json.ts` | Tipos: `JsonValue`, `JsonParseResult`, `JsonSyntaxError`, `IndentOption`, `ViewMode` |
| application | `useCases/parseJson.ts` | `JSON.parse` en try/catch; línea/columna desde `position N` o `line X column Y` |
| application | `useCases/locateJsonError.ts` | Escáner estricto que ubica el error cuando el mensaje no trae posición (comas finales, tokens sueltos) |
| application | `useCases/textLocation.ts` | offset ⇄ línea/columna contando saltos de línea |
| application | `useCases/transformJson.ts` | Formatear, minificar, escapar, desescapar, ordenar claves, formatear al pegar |
| application | `useCases/expandNestedJson.ts` | Analiza JSON anidado: strings con JSON serializado (incluso doble) → objetos |
| application | `useCases/diffLines.ts` | Diferencia línea a línea (Myers O(ND), recorta prefijo/sufijo comunes) |
| application | `useCases/prepareDiff.ts` | Normaliza ambos lados antes de comparar (formato común, claves ordenadas opcional) |
| presentation/hooks | `useJsonViewer` | Hook de página: documento izquierdo/derecho, dividir pantalla, comparar, tema |
| | `useJsonDocument` | Estado de un panel (historial, parseo, vista, sangría, acciones) |
| | `useJsonDiff`, `useEscapeKey` | View model de la comparación; salir con Esc |
| | `useJsonEditor` | Sincroniza scroll de textarea, colores y numeración; atajos; ir al error |
| | `useTextHistory` | Deshacer/rehacer (agrupa pulsaciones seguidas) |
| | `useTreeView` | View model del árbol, expandir/colapsar todo |
| | `useFileTransfer`, `useClipboard`, `useShareLink` | Subir/arrastrar/descargar, copiar, enlace compartible |
| presentation/utils | `diffRows.ts` (filas lado a lado), `highlight.ts`, `jsonTree.ts`, `status.ts`, `text.ts`, `jsonActions.ts`, `shareLink.ts`, `fileIO.ts`, `editorShortcuts.ts`, `*.constants.ts` | Funciones puras y constantes |
| presentation/components | `AppBar`, `JsonPane`, `Toolbar`, `ModeTabs`, `ToolbarButton`, `JsonEditor`, `ErrorBanner`, `TreeView`, `TreeNode`, `StatusBar`, `DiffView`, `DiffCell` | Solo vista |

Compartido: `src/shared/theme/` (tema claro/oscuro con `useSyncExternalStore` + script anti-parpadeo).

## Funcionalidades
- Validación en vivo con línea/columna del error, resaltado de la línea y botón "Ir al error".
- Formatear (2, 4 espacios o Tab), minificar, escapar/desescapar string JSON.
- Analizar JSON anidado y formatear (botón de capas): convierte strings con JSON adentro en objetos.
- Pegar en un editor vacío formatea automáticamente si es JSON válido.
- Dividir pantalla: dos paneles independientes (cada uno con su historial, vista y archivos).
- Comparar: diferencias lado a lado (rojo = quitado, verde = agregado, rayado = sin línea), contador +/−, opción "Ignorar orden de claves", Esc para salir.
- Vista en árbol con `<details>/<summary>` (colapsar sin JS extra) y colores por tipo.
- Subir archivo, arrastrar y soltar, descargar, copiar.
- Compartir: el JSON va comprimido (deflate) en el `#hash`, que el navegador no envía al servidor.
- Deshacer/rehacer (Ctrl+Z / Ctrl+Y), Tab indenta, Shift+Alt+F formatea.
- Privacidad: todo corre en el navegador; no hay backend ni Server Actions.

## Notas
- Sin backend: no aplican `infrastructure/`, `domain/ports/` ni `runAction`. Si se agrega persistencia (p. ej. historial en servidor), seguir el patrón puerto → repositorio → action.
- El resaltado de sintaxis se desactiva por encima de 200 000 caracteres (`HIGHLIGHT_MAX_CHARS`).

## Verificación (última ejecución: 2026-10-06)
- `npx tsc --noEmit -p .` ✔ · `npx eslint src` ✔ · `npm run build` ✔
- Sin hooks de React en `.tsx` ✔ · ningún archivo > 200 líneas ✔
