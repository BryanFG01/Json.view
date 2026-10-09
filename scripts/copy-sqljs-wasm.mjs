// Copia el WebAssembly de sql.js a public/ para servirlo junto a la app (se ejecuta en postinstall).
// Así la versión del .wasm siempre coincide con la de la librería instalada.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "sql.js", "dist", "sql-wasm-browser.wasm");
const target = join(root, "public", "sqljs", "sql-wasm-browser.wasm");
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("sql.js wasm copiado a public/sqljs/");
