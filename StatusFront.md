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
| application | `useCases/sortBlock.ts` | Ordenar solo el bloque del cursor (re-indentado en su sitio) y `collectArrayFields` (campos de los arrays de objetos) |
| application | `useCases/detectLanguage.ts` | Decide JSON o SQL para un texto nuevo (JSON válido gana; luego extensión `.sql`/`.json`; luego si empieza como SQL) |
| application | `useCases/sqlText.ts` | SQL a una línea sin ningún salto (también dentro de `'…'`; respeta los espacios de los literales y los cuerpos `$$…$$`; `--` → `/* */`), escapar como literal `'…'` (`'` → `''`) y desescapar `'…'` / `"…"` |
| domain | `models/sqlite.ts` | Tipos de la base SQLite y puerto `ISqliteDatabase` (info, query, schema, close) |
| infrastructure | `sqlite/sqlJsDatabase.ts` | Adaptador del puerto con sql.js (WebAssembly, carga diferida desde `/sqljs`); enteros grandes con `useBigInt` |
| application | `useCases/sqliteFile.ts` | Firma SQLite, modo WAL y **checkpoint manual del `-wal`** (verifica checksums; solo transacciones confirmadas) |
| application | `useCases/zipFile.ts` | Lee `.zip` en el navegador (stored / deflate con `DecompressionStream`), sin dependencias |
| application | `useCases/classifyUpload.ts` | Decide qué abrir: base SQLite (+ `-wal`), texto (JSON/SQL/txt), dentro o fuera de un `.zip`, o aviso si es otro binario |
| application | `useCases/sqliteCells.ts` | Celdas → JSON: BLOB `{ blob: base64, bytes }`, enteros > 2^53 como texto exacto |
| application | `useCases/decodeText.ts` | Lee archivos con la codificación correcta: BOM UTF-8/UTF-16 (SSMS), UTF-16 sin BOM, UTF-8 y ANSI (Windows-1252) |
| application | `useCases/joinLines.ts` | Une cualquier texto en una línea (sin saltos, sangrías ni líneas vacías): Minificar cuando no es JSON válido |
| application | `useCases/formatSql.ts` | Formatea SQL con `sql-formatter` (carga diferida): MAYÚSCULAS en palabras clave, funciones y tipos; dialecto y sangría. Si el dialecto falla, prueba el detectado y luego los demás; errores en español |
| application | `useCases/detectSqlDialect.ts` | Adivina el dialecto por pistas (`@var`, `[col]`, `TOP`, `NOLOCK`, `FORMAT(` → SQL Server; `::`, `ILIKE` → PostgreSQL; `` ` `` → MySQL; `NVL`, `DUAL` → Oracle…) |
| application | `useCases/sqlTableHints.ts` | Mantiene `WITH (NOLOCK, INDEX(ix))` de SQL Server pegado a su tabla al formatear |
| application | `useCases/prepareDiff.ts` | Normaliza ambos lados antes de comparar (formato común + opciones de orden) |
| presentation/editor | `cmExtensions.ts` | Extensiones de CodeMirror: numeración, plegado, atajos, pegar, `externalChange` |
| | `cmTheme.ts` | Tema y colores de sintaxis con las variables CSS (claro/oscuro sin reconfigurar) |
| | `cmErrorLine.ts` | Marca la línea del error de sintaxis (fondo + margen) |
| | `cmLanguage.ts` | Compartimento de lenguaje: JSON o SQL (con dialecto) sin recrear el editor |
| | `cmSearchPanel.ts`, `cmSearchCount.ts`, `cmSearchTheme.ts` | Buscador propio de cada editor (español, contador "3 de 12", Aa / palabra / regex, reemplazar) |
| | `cmBracketScope.ts` | Bloque { } / [ ] del cursor pintado en el margen (fuerte sobre una llave, suave dentro de un bloque) |
| presentation/hooks | `useJsonViewer` | Hook de página: documento izquierdo/derecho, dividir pantalla, comparar, tema |
| | `useJsonDocument` | Estado de un panel (historial, parseo, vista, sangría, acciones) |
| | `useJsonEditor` → `useCodeMirror` | Monta CodeMirror como vista controlada por React; ir al error |
| presentation/workers | `sqlFormat.worker.ts` + `utils/backgroundSqlFormatter.ts` | Formateo SQL en un Web Worker (uno por panel), cancelable: la página no se congela con scripts grandes |
| | `useSqliteSource` | Subidas del panel y base SQLite abierta: tablas, consulta (Ctrl+Enter), esquema; resultados como JSON en el editor. Es el punto de composición que instancia el adaptador de infraestructura (no hay Server Actions: todo es local) |
| | `useSqlNormalized` | Formatea en segundo plano las dos consultas al comparar SQL |
| | `useSqlMode` | Modo JSON/SQL del panel, dialecto y formateo SQL (el error se descarta solo al editar) |
| | `useFindShortcut` | Ctrl+F abre el buscador del panel activo (foco o último clic), no el del navegador |
| | `useJsonDiff`, `useEscapeKey` | View model de la comparación (con opciones de orden); salir con Esc |
| | `useSortMenu` | Menú "Ordenar" de cada panel (posición `fixed` para no quedar recortado por la barra) |
| | `useTextHistory` | Deshacer/rehacer (fuente de verdad del texto; agrupa pulsaciones seguidas) |
| | `useTreeView`, `useTreeNode` | Árbol perezoso: cada nodo calcula y pinta sus hijos solo mientras está abierto |
| | `useFileTransfer`, `useClipboard`, `useShareLink` | Subir/arrastrar/descargar, copiar, enlace compartible |
| presentation/utils | `treeCopy.ts` (qué copia cada nodo del árbol), `diffRows.ts` (filas sin colorear), `diffView.ts` (cambios + contexto, bloques iguales colapsados, máx. 2.000 filas), `highlight.ts` (colores en Comparar), `jsonTree.ts` (nodos perezosos, grupos de 100), `status.ts`, `text.ts`, `jsonActions.ts`, `shareLink.ts`, `fileIO.ts`, `sortOptions.constants.ts`, `*.constants.ts` | Funciones puras y constantes |
| presentation/components | `AppBar`, `JsonPane`, `Toolbar`, `SortMenu`, `ModeTabs`, `ToolbarButton`, `JsonEditor`, `ErrorBanner`, `TreeView`, `TreeNode`, `StatusBar`, `DiffView`, `DiffCell` | Solo vista |

Compartido: `src/shared/tooltip/` (tooltip global: `tip.ts` posición y atributos `data-tip*`, `useTooltip.ts` escucha puntero/foco, `Tooltip.tsx` lo pinta; textos en `presentation/utils/tooltips.constants.ts`) · `src/shared/theme/` (tema claro/oscuro con `useSyncExternalStore` + script anti-parpadeo cargado con `next/script` `beforeInteractive`).

App: `src/app/layout.tsx` (metadata, fuentes Geist, tema), `src/app/page.tsx` (monta `JsonViewerPage`), `src/app/icon.png` (favicon: recorte cuadrado de `public/Logo.jpg`).

### Editor: cómo se sincroniza CodeMirror con React
- `useTextHistory` es la fuente de verdad. Lo que escribe el usuario sube por `onChange`.
- Los cambios de React (formatear, deshacer, subir archivo) bajan como transacción anotada con `externalChange`, para no volver a subir como escritura.
- El historial propio de CodeMirror no se usa: Ctrl+Z / Ctrl+Y llaman a `useTextHistory`, igual que los botones de la barra.

## Funcionalidades
- Validación en vivo con línea/columna del error, línea marcada en rojo y botón "Ir al error".
- **Plegado de bloques** (⌄ / › en el margen; atajos Ctrl+Shift+[ y Ctrl+Shift+]).
- **Modo SQL** (interruptor `JSON | SQL` en cada panel): colores de SQL y **Formatear** (botón o Shift+Alt+F) con palabras clave, funciones y tipos en MAYÚSCULAS, una cláusula por línea y la sangría del panel. Dialectos: estándar, PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite, BigQuery (selector en la barra de estado; cambiarlo reformatea). **El dialecto se detecta solo** mientras no se elija a mano (p. ej. `@variables` → SQL Server) y, si el elegido no entiende la consulta, se prueban los demás; la barra muestra "(detectado)". Se activa solo al pegar SQL en un panel vacío (y lo formatea), al subir un `.sql` o con el botón "Parece SQL: cambiar a modo SQL" del aviso de error. Descarga como `consulta.sql`. Cada panel tiene su propio modo.
  - En SQL también: **Minificar** (una línea; respeta textos e identificadores entre comillas, `--` pasa a `/* */`), **Escapar como texto SQL** (`'…'` con `'` → `''`, listo para `INSERT … VALUES ('…')`), **Desescapar** (`'…'` o `"…"`), buscar, copiar bloque, compartir.
  - Solo JSON (desactivados en SQL con tooltip "Solo disponible en modo JSON"): Árbol, Ordenar, Analizar JSON anidado.
  - **Comparar SQL**: con "Normalizar formato SQL" (activo por defecto) formatea ambas consultas antes del diff, así solo marca cambios reales; colores de SQL en el diff. Si un panel es JSON y el otro SQL, se compara el texto tal cual con un aviso neutro.
- **Buscar y reemplazar dentro del editor** (Ctrl+F / Ctrl+H o botón lupa): la barra se abre dentro del panel; con la pantalla dividida, cada panel tiene su propio buscador independiente. Contador ("3 de 12", "Sin resultados", "Regex no válida"), Enter / Shift+Enter (o F3) para siguiente/anterior, mayúsculas, palabra completa, regex, reemplazar uno o todos (se puede deshacer). Coincidencias resaltadas; al seleccionar texto se marcan sus otras apariciones. En la vista Árbol, Ctrl+F vuelve al Editor; en Comparar, Ctrl+F queda para el navegador.
- **Autocierre** de `{ }`, `[ ]` y `" "`: al escribir la apertura se añade el cierre; escribir el cierre lo salta; Backspace en un par vacío borra los dos; con texto seleccionado lo envuelve; Enter entre llaves abre el bloque con sangría.
- **Llaves emparejadas**: al pararse (clic o flechas) junto a `{ } [ ]` se resaltan la apertura y el cierre, y la columna de números se pinta del bloque completo (apertura/cierre intensos, intermedias suaves). Dentro de un bloque, marca suave del bloque que lo contiene. La barra de estado muestra "Bloque: líneas X–Y"; Ctrl+Shift+\ salta a la llave pareja. En bloques de más de 3.000 líneas solo se marcan apertura y cierre.
- **Tooltips**: al pasar el ratón (o con foco de teclado) cada icono explica qué hace, con su atajo, y si está desactivado dice por qué. Aparecen en ~150 ms (al instante si ya hay uno abierto), se recolocan para no salirse de la pantalla y no se muestran en pantallas táctiles. Sustituyen al `title` nativo (lento y genérico).
- **Copiar un nodo**: en el editor, botón "Copiar bloque" en la barra de estado (copia solo el `{ }` / `[ ]` del cursor, re-formateado con la sangría del panel). En el Árbol, botón de copiar en cada fila (al pasar el ratón; siempre visible en pantallas táctiles): objetos/arrays como JSON formateado, textos sin comillas, grupos `[100 … 199]` solo con su rango.
- Formatear (2, 4 espacios o Tab), minificar, escapar/desescapar string JSON.
- **Minificar = una sola línea, sin ningún salto** (JSON y SQL): con JSON válido, `JSON.stringify`; si el texto no es JSON válido (texto suelto, JSON a medias), une sus líneas (sin sangría ni líneas vacías); en SQL, también quita los saltos dentro de los textos `'…'`.
- Analizar JSON anidado y formatear (botón de capas): convierte strings con JSON adentro en objetos.
- Pegar en un editor vacío formatea automáticamente si es JSON válido.
- Dividir pantalla: dos paneles independientes (cada uno con su historial, vista y archivos).
- **Ordenar** (botón en cada panel, también al dividir), en todos los niveles de anidación:
  - Claves A→Z / Z→A, valores de arrays, o todo. Orden natural (`item2` antes que `item10`, `9` antes que `10`).
  - **Arrays de objetos por campo** (asc/desc): el menú propone los campos reales de los arrays de objetos del JSON; se aplica a todos los arrays anidados que tengan ese campo; los elementos sin el campo van al final.
  - **Aplicar a**: todo el JSON o **solo el bloque `{ }` / `[ ]` del cursor** (se ordena en su sitio, con su sangría; el resto no cambia).
  - Se puede deshacer.
- Comparar: diferencias lado a lado (rojo = quitado, verde = agregado, rayado = sin línea), contador +/−, selector de orden de claves (original / A→Z / Z→A) y "Ordenar arrays" (solo afecta a la vista, no a los textos), Esc para salir.
- Vista en árbol con `<details>/<summary>` (colapsar sin JS extra) y colores por tipo.
- Subir archivo, arrastrar y soltar, descargar, copiar. Acepta `.json`, `.txt` y **scripts SQL** (`.sql`, `.ddl`, `.dml`, `.pgsql`, `.psql`: SSMS "Generar scripts", mysqldump, pg_dump). Lee bien **UTF-16** (lo que guarda SSMS por defecto), UTF-8 y ANSI (tildes y ñ correctas).
- **Bases SQLite** (`.db` de Flutter/sqflite, Drift, Android; `.sqlite`, `.sqlite3`, `.db3`), sueltas o dentro de un **`.zip`**, con su **`.db-wal`** (se suben juntos o en el zip): barra con nombre · tablas · vistas · versión (`user_version`) · tamaño; selector de tablas con nº de filas (muestra las primeras 1.000 como JSON); consulta propia con Ctrl+Enter (hasta 10.000 filas); "Esquema" (CREATE formateados). Los resultados quedan como JSON en el panel: Árbol, Ordenar, Buscar y **Comparar dos bases** (una por panel) funcionan. Avisos: base WAL sin su `-wal` ("pueden faltar los últimos cambios"), `-wal` suelto, binario no soportado (cifrada/SQLCipher, `.bak`/`.mdf`). El archivo original nunca se modifica y nada sale del navegador. No soporta: SQLCipher, Hive, Isar.
- **Scripts SQL grandes**: el formateo corre en segundo plano (≈4 s por MB) con "Formateando SQL… Cancelar" en la barra de estado y la página sigue respondiendo; si se edita mientras tanto, no se pisa el texto. Por encima de ~500 KB, al pegar no se formatea solo (botón Formatear); por encima de ~1 MB solo se prueban el dialecto elegido y el detectado.
- Compartir: el JSON va comprimido (deflate) en el `#hash`, que el navegador no envía al servidor.
- Deshacer/rehacer (Ctrl+Z / Ctrl+Y), Tab indenta, Shift+Alt+F formatea.
- Privacidad: todo corre en el navegador; no hay backend ni Server Actions.
- Tema claro/oscuro recordado en `localStorage`; favicon con el logo.

## Rendimiento con JSON grandes
Medido con `npm run test:perf` (build de producción, Chromium). Límite de la prueba: 15 s por operación.

| Líneas | Tamaño | Abrir | Teclear 5 car. | Ordenar | Minificar | Árbol | Comparar | Memoria |
|---|---|---|---|---|---|---|---|---|
| 10.000 | 0,2 MB | 0,3 s | 0,1 s | 0,2 s | 0,1 s | 0,2 s | 1,2 s | 40 MB |
| 100.000 | 1,8 MB | 0,8 s | 0,2 s | 0,4 s | 0,2 s | 0,3 s | 1,9 s | 82 MB |
| 500.000 | 9,1 MB | 2,3 s | 0,7 s | 1,1 s | 0,3 s | 0,2 s | 2,3 s | 347 MB |
| 1.000.000 | 18,2 MB | 4,5 s | 1,0 s | 1,9 s | 0,4 s | 0,2 s | 3,3 s | 561 MB |

Antes de optimizar: 100.000 líneas tardaban 8,9 s en el Árbol y 58 s en Comparar (1,3 GB), y 500.000 o más colgaban la pestaña.

Qué lo hace posible:
- **Árbol perezoso**: solo existen los nodos abiertos; listas grandes en grupos `[0 … 99]` (y de 10.000 en 10.000 si pasan de 10.000).
- **Comparar por bloques**: cambios con 3 líneas de contexto; lo igual se colapsa ("Mostrar 500 de N líneas sin cambios"); máximo 2.000 filas dibujadas ("Mostrar más"); solo se colorean las filas visibles.
- **Edición**: validación con `useDeferredValue` (el teclado responde primero; las acciones re-validan el texto actual), historial de deshacer con tope de ~50 M caracteres, tamaño en bytes sin copiar el texto, sin recorrer el documento para sincronizar CodeMirror.
- **Límite conocido**: con ~1 M de líneas cada tecla cuesta ~0,2 s (se copia el documento a React). Para ir más allá: Web Worker (tarea 7).

## Responsive (revisado 2026-10-06)
Revisado con capturas en iPhone 13 (vertical y horizontal) e iPad (vertical y horizontal): editor, menú Ordenar, pantalla dividida, Comparar y Árbol. Sin desbordes horizontales en ningún caso.
- Barra superior: por debajo de `sm` solo iconos (nombre accesible por `aria-label`/`title`); el aviso de privacidad solo desde `lg`.
- Barra de acciones: los botones siguen a las pestañas y bajan a otra fila si el panel es estrecho (máx. 2 filas), en lugar de esconderse tras un scroll.
- Pantalla dividida: apilada solo en vertical estrecho; en horizontal (`landscape:`) o desde `md`, lado a lado.
- Comparar: columnas de número y signo más estrechas en móvil.
- Repetir la revisión: `npx tsx e2e/responsive.manual.mts <url> <carpeta>` (capturas + informe de desbordes).
- El botón redondo "N" abajo a la izquierda es el indicador de desarrollo de Next.js; no aparece en producción.

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
- [ ] 10. Accesibilidad y UX: teclado en el árbol, ARIA, paleta Ctrl+K (responsive móvil/tablet ya hecho).
- [ ] 11. Exportar: .json, .min.json, string escapado, imprimir/PDF del árbol.
- [ ] 12. Preferencias persistentes (sangría, tema, vista, split).
- [ ] Logo en la barra superior (hoy usa el icono `{ }`).

## Notas
- Sin backend: no aplican `infrastructure/`, `domain/ports/` ni `runAction`. Si se agrega persistencia (p. ej. historial en servidor), seguir el patrón puerto → repositorio → action.
- `highlight.ts` ya solo colorea la vista Comparar; se desactiva por encima de 200 000 caracteres (`HIGHLIGHT_MAX_CHARS`). El editor usa el parser de CodeMirror.
- Dependencias de CodeMirror (~75 KB gzip): `@codemirror/{state,view,language,lang-json,commands}`, `@lezer/highlight`, `@codemirror/autocomplete` (solo `closeBrackets`, el autocierre) y `@codemirror/search` (motor de búsqueda; la barra es propia), `@codemirror/lang-sql` (colores de SQL).
- `sql.js` (39 KB JS + 643 KB WebAssembly en `public/sqljs`, copiado por `postinstall` con `scripts/copy-sqljs-wasm.mjs`) se carga **solo al abrir una base SQLite** (verificado). `@types/node` ≥ 22 para `node:sqlite` en los fixtures de test (`test/fixtures.ts`).
- `sql-formatter` (~286 KB sin comprimir) se carga **solo al formatear SQL** (import dinámico, chunk aparte; verificado que la página inicial no lo incluye).

## Tests
| Tipo | Comando | Qué cubre |
|---|---|---|
| Unitarios + propiedades | `npm test` | `parseJson` (ubicación de errores), `locateJsonError` (≡ `JSON.parse` en strings aleatorios), `expandNestedJson`, `diffLines` (Myers = LCS de referencia, 1000 casos), `sortJson` (orden natural, claves numéricas, idempotencia, ≡ formatear sin orden) |
| Unitarios (utils) | `npm test` | `jsonTree` (perezoso, grupos, 1 M de elementos), `diffView` (contexto, revelar por partes, límite de filas) |
| Rendimiento | `npm run test:perf` | 10 k, 100 k, 500 k y 1 M líneas: abrir, teclear, ordenar, minificar, deshacer, árbol, comparar (< 15 s cada una) |
| E2E | `npm run test:e2e` | Validar, formatear + plegar, deshacer/rehacer, pegar, dividir, comparar, ordenar panel, ordenar al comparar, subir archivo, compartir enlace |

E2E levanta su propio build en el puerto 3210 (no choca con `next dev`). Captura manual: `npx tsx e2e/screenshot.manual.mts <url> <salida.png>`.

## Verificación (última ejecución: 2026-10-06)
- `npx tsc --noEmit -p .` ✔ · `npx eslint src e2e` ✔ · `npm run build` ✔
- `npm test`: 105/105 ✔ · `npm run test:e2e`: 34/34 ✔ (en `e2e/editor`, `navigation`, `search`, `sql`, `panels`, `files`) · `npm run test:perf`: 4/4 ✔ (hasta 1 M de líneas)
- Publicación: Vercel despliega desde `main` de GitHub (`BryanFG01/Json.view`). Lo que no está commiteado y pusheado no se publica (p. ej. el favicon `src/app/icon.png`).
- Sin hooks de React en `.tsx` ✔ · ningún archivo > 200 líneas ✔
- Dev: `npm run dev` (corre en http://localhost:3001).
