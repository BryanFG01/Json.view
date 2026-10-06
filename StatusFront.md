# Estado del frontend — JSON Viewer

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react · CodeMirror 6.
Tests: Vitest + fast-check (unitarios/propiedades) · Playwright (e2e, Chromium).
Arquitectura: `src/features/<feature>/{domain,application,presentation}` — los `.tsx` solo renderizan.

## Feature `json-viewer`

| Capa | Archivo | Responsabilidad |
|---|---|---|
| domain | `models/json.ts` | Tipos: `JsonValue`, `JsonParseResult`, `JsonSyntaxError`, `IndentOption`, `ViewMode` |
| domain | `models/diff.ts` | Tipos de la comparación: `DiffOp` (`equal` / `insert` / `delete`) |
| application | `useCases/parseJson.ts` | `JSON.parse` en try/catch; línea/columna desde `position N` o `line X column Y` |
| application | `useCases/locateJsonError.ts` | Escáner estricto que ubica el error cuando el mensaje no trae posición (comas finales, tokens sueltos) |
| application | `useCases/textLocation.ts` | offset ⇄ línea/columna contando saltos de línea |
| application | `useCases/transformJson.ts` | Formatear, minificar, escapar, desescapar, ordenar claves, formatear al pegar |
| application | `useCases/expandNestedJson.ts` | Analiza JSON anidado: strings con JSON serializado (incluso doble) → objetos |
| application | `useCases/diffLines.ts` | Diferencia línea a línea (Myers O(ND), recorta prefijo/sufijo comunes) |
| application | `useCases/sortJson.ts` | Ordena claves (A→Z / Z→A) y arrays en orden natural (`item2` < `item10`, números por valor); serializa directo para respetar el orden aun con claves numéricas |
| application | `useCases/prepareDiff.ts` | Normaliza ambos lados antes de comparar (formato común + opciones de orden) |
| presentation/editor | `cmExtensions.ts` | Extensiones de CodeMirror: numeración, plegado, atajos, pegar, `externalChange` |
| | `cmTheme.ts` | Tema y colores de sintaxis con las variables CSS (claro/oscuro sin reconfigurar) |
| | `cmErrorLine.ts` | Marca la línea del error de sintaxis (fondo + margen) |
| presentation/hooks | `useJsonViewer` | Hook de página: documento izquierdo/derecho, dividir pantalla, comparar, tema |
| | `useJsonDocument` | Estado de un panel (historial, parseo, vista, sangría, acciones) |
| | `useJsonEditor` → `useCodeMirror` | Monta CodeMirror como vista controlada por React; ir al error |
| | `useJsonDiff`, `useEscapeKey` | View model de la comparación (con opciones de orden); salir con Esc |
| | `useSortMenu` | Menú "Ordenar" de cada panel (posición `fixed` para no quedar recortado por la barra) |
| | `useTextHistory` | Deshacer/rehacer (fuente de verdad del texto; agrupa pulsaciones seguidas) |
| | `useTreeView` | View model del árbol, expandir/colapsar todo |
| | `useFileTransfer`, `useClipboard`, `useShareLink` | Subir/arrastrar/descargar, copiar, enlace compartible |
| presentation/utils | `diffRows.ts`, `highlight.ts` (colores en Comparar), `jsonTree.ts`, `status.ts`, `text.ts`, `jsonActions.ts`, `shareLink.ts`, `fileIO.ts`, `sortOptions.constants.ts`, `*.constants.ts` | Funciones puras y constantes |
| presentation/components | `AppBar`, `JsonPane`, `Toolbar`, `SortMenu`, `ModeTabs`, `ToolbarButton`, `JsonEditor`, `ErrorBanner`, `TreeView`, `TreeNode`, `StatusBar`, `DiffView`, `DiffCell` | Solo vista |

Compartido: `src/shared/theme/` (tema claro/oscuro con `useSyncExternalStore` + script anti-parpadeo cargado con `next/script` `beforeInteractive`).

App: `src/app/layout.tsx` (metadata, fuentes Geist, tema), `src/app/page.tsx` (monta `JsonViewerPage`), `src/app/icon.png` (favicon: recorte cuadrado de `public/Logo.jpg`).

### Editor: cómo se sincroniza CodeMirror con React
- `useTextHistory` es la fuente de verdad. Lo que escribe el usuario sube por `onChange`.
- Los cambios de React (formatear, deshacer, subir archivo) bajan como transacción anotada con `externalChange`, para no volver a subir como escritura.
- El historial propio de CodeMirror no se usa: Ctrl+Z / Ctrl+Y llaman a `useTextHistory`, igual que los botones de la barra.

## Funcionalidades
- Validación en vivo con línea/columna del error, línea marcada en rojo y botón "Ir al error".
- **Plegado de bloques** (⌄ / › en el margen; atajos Ctrl+Shift+[ y Ctrl+Shift+]).
- Formatear (2, 4 espacios o Tab), minificar, escapar/desescapar string JSON.
- Analizar JSON anidado y formatear (botón de capas): convierte strings con JSON adentro en objetos.
- Pegar en un editor vacío formatea automáticamente si es JSON válido.
- Dividir pantalla: dos paneles independientes (cada uno con su historial, vista y archivos).
- **Ordenar** (botón en cada panel, también al dividir): claves A→Z, Z→A, valores de arrays, o todo. Orden natural (`item2` antes que `item10`, `9` antes que `10`); se puede deshacer.
- Comparar: diferencias lado a lado (rojo = quitado, verde = agregado, rayado = sin línea), contador +/−, selector de orden de claves (original / A→Z / Z→A) y "Ordenar arrays" (solo afecta a la vista, no a los textos), Esc para salir.
- Vista en árbol con `<details>/<summary>` (colapsar sin JS extra) y colores por tipo.
- Subir archivo, arrastrar y soltar, descargar, copiar.
- Compartir: el JSON va comprimido (deflate) en el `#hash`, que el navegador no envía al servidor.
- Deshacer/rehacer (Ctrl+Z / Ctrl+Y), Tab indenta, Shift+Alt+F formatea.
- Privacidad: todo corre en el navegador; no hay backend ni Server Actions.
- Tema claro/oscuro recordado en `localStorage`; favicon con el logo.

## Hoja de ruta (una mejora por vez, con revisión entre cada una)
Decisiones tomadas: CodeMirror 6 antes de la tarea 1 · árbol híbrido (`<details>` hasta ~5.000 nodos, virtualizado por encima) · e2e con Chromium descargado.

- [x] 0. Infraestructura de tests: Vitest, fast-check, Playwright; scripts sueltos migrados a tests.
- [x] 3. Plegado de bloques (migración a CodeMirror 6, hecha primero).
- [ ] 1. Ruta JSON del cursor con botón copiar (`jsonSourceMap.ts` compartido con 2 y 5).
- [ ] 2. Búsqueda y filtro por clave/valor/ruta, resaltado en árbol y editor, Enter / Shift+Enter.
- [ ] 4. Resaltado dentro de la línea en Comparar.
- [ ] 5. Validación con JSON Schema (Ajv, carga diferida).
- [ ] 6. Conversores JSON ⇄ CSV / YAML, JSON → TypeScript.
- [ ] 7. Web Worker para archivos > 5 MB (cancelable) + árbol virtualizado.
- [ ] 8. Límites del enlace compartible (aviso ~8 KB, bloqueo ~2 MB).
- [ ] 9. Vista Grafo.
- [ ] 10. Accesibilidad y UX: teclado en el árbol, ARIA, paleta Ctrl+K, móvil.
- [ ] 11. Exportar: .json, .min.json, string escapado, imprimir/PDF del árbol.
- [ ] 12. Preferencias persistentes (sangría, tema, vista, split).
- [ ] Logo en la barra superior (hoy usa el icono `{ }`).

## Notas
- Sin backend: no aplican `infrastructure/`, `domain/ports/` ni `runAction`. Si se agrega persistencia (p. ej. historial en servidor), seguir el patrón puerto → repositorio → action.
- `highlight.ts` ya solo colorea la vista Comparar; se desactiva por encima de 200 000 caracteres (`HIGHLIGHT_MAX_CHARS`). El editor usa el parser de CodeMirror.
- Dependencias de CodeMirror (~65 KB gzip): `@codemirror/{state,view,language,lang-json,commands}`, `@lezer/highlight`.

## Tests
| Tipo | Comando | Qué cubre |
|---|---|---|
| Unitarios + propiedades | `npm test` | `parseJson` (ubicación de errores), `locateJsonError` (≡ `JSON.parse` en strings aleatorios), `expandNestedJson`, `diffLines` (Myers = LCS de referencia, 1000 casos), `sortJson` (orden natural, claves numéricas, idempotencia, ≡ formatear sin orden) |
| E2E | `npm run test:e2e` | Validar, formatear + plegar, deshacer/rehacer, pegar, dividir, comparar, ordenar panel, ordenar al comparar, subir archivo, compartir enlace |

E2E levanta su propio build en el puerto 3210 (no choca con `next dev`). Captura manual: `npx tsx e2e/screenshot.manual.mts <url> <salida.png>`.

## Verificación (última ejecución: 2026-10-06)
- `npx tsc --noEmit -p .` ✔ · `npx eslint src e2e` ✔ · `npm run build` ✔
- `npm test`: 30/30 ✔ · `npm run test:e2e`: 10/10 ✔
- Publicación: Vercel despliega desde `main` de GitHub (`BryanFG01/Json.view`). Lo que no está commiteado y pusheado no se publica (p. ej. el favicon `src/app/icon.png`).
- Sin hooks de React en `.tsx` ✔ · ningún archivo > 200 líneas ✔
- Dev: `npm run dev` (corre en http://localhost:3001).
