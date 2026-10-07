import {
  closeSearchPanel, findNext, findPrevious, getSearchQuery, openSearchPanel, replaceAll, replaceNext,
  SearchQuery, setSearchQuery,
} from "@codemirror/search";
import { runScopeHandlers, type EditorView, type Panel, type ViewUpdate } from "@codemirror/view";
import { countMatches, describeCount } from "./cmSearchCount";

// Barra de búsqueda propia (en español, con contador). Cada editor tiene la suya: con la pantalla
// dividida, cada panel busca por separado.

type Flag = "caseSensitive" | "regexp" | "wholeWord";

interface TipText {
  tip: string;
  desc: string;
  keys?: string;
}

/** Paneles abiertos, para que Ctrl+H pueda mostrar la fila de reemplazo del editor correcto. */
const panels = new WeakMap<EditorView, { showReplace: () => void }>();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, attrs: Record<string, string> = {}) {
  const node = document.createElement(tag);
  node.className = className;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

function button(text: string, tip: TipText, onClick: () => void, className = "cm-jv-btn") {
  const node = el("button", className, { type: "button", "aria-label": tip.tip, "data-tip": tip.tip, "data-tip-desc": tip.desc });
  if (tip.keys) node.dataset.tipKeys = tip.keys;
  node.textContent = text;
  node.addEventListener("click", onClick);
  return node;
}

function input(placeholder: string, value: string, mainField = false) {
  const node = el("input", "cm-jv-input", { type: "text", placeholder, "aria-label": placeholder, spellcheck: "false" });
  if (mainField) node.setAttribute("main-field", "true");
  node.value = value;
  return node;
}

export function createSearchPanel(view: EditorView): Panel {
  const initial = getSearchQuery(view.state);
  const flags: Record<Flag, boolean> = { caseSensitive: initial.caseSensitive, regexp: initial.regexp, wholeWord: initial.wholeWord };
  const searchInput = input("Buscar", initial.search, true);
  const replaceInput = input("Reemplazar por…", initial.replace);
  const counter = el("span", "cm-jv-count", { "aria-live": "polite" });
  const dom = el("div", "cm-jv-search", { role: "search", "aria-label": "Buscar en el JSON" });
  const replaceRow = el("div", "cm-jv-row cm-jv-replace");
  replaceRow.hidden = !initial.replace;

  const commit = () => {
    const query = new SearchQuery({ search: searchInput.value, replace: replaceInput.value, ...flags });
    if (!query.eq(getSearchQuery(view.state))) view.dispatch({ effects: setSearchQuery.of(query) });
  };
  const refreshCount = () => {
    const query = getSearchQuery(view.state);
    const count = countMatches(query, view.state);
    counter.textContent = describeCount(query, count);
    counter.classList.toggle("is-empty", Boolean(query.search) && count.total === 0);
  };
  const toggle = (flag: Flag, text: string, tip: TipText) => {
    const node = button(text, tip, () => {
      flags[flag] = !flags[flag];
      node.setAttribute("aria-pressed", String(flags[flag]));
      commit();
      searchInput.focus();
    }, "cm-jv-btn cm-jv-toggle");
    node.setAttribute("aria-pressed", String(flags[flag]));
    return node;
  };
  const showReplace = () => {
    replaceRow.hidden = false;
    replaceInput.focus();
  };
  const onKeyDown = (event: KeyboardEvent, onEnter: () => void) => {
    if (runScopeHandlers(view, event, "search-panel")) return event.preventDefault();
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
    }
  };

  searchInput.addEventListener("input", commit);
  replaceInput.addEventListener("input", commit);
  searchInput.addEventListener("keydown", (e) => onKeyDown(e, () => (e.shiftKey ? findPrevious : findNext)(view)));
  replaceInput.addEventListener("keydown", (e) => onKeyDown(e, () => replaceNext(view)));

  const searchRow = el("div", "cm-jv-row");
  searchRow.append(
    searchInput,
    counter,
    toggle("caseSensitive", "Aa", { tip: "Distinguir mayúsculas", desc: "Solo coincide si las mayúsculas son iguales." }),
    toggle("wholeWord", "ab", { tip: "Palabra completa", desc: "No coincide dentro de otras palabras." }),
    toggle("regexp", ".*", { tip: "Expresión regular", desc: 'Busca con regex, p. ej. "id":\\s*\\d+' }),
    button("↑", { tip: "Anterior", desc: "Va a la coincidencia anterior.", keys: "Shift+Enter" }, () => findPrevious(view)),
    button("↓", { tip: "Siguiente", desc: "Va a la coincidencia siguiente.", keys: "Enter" }, () => findNext(view)),
    button("⇄", { tip: "Reemplazar", desc: "Muestra la fila para reemplazar texto.", keys: "Ctrl+H" }, () =>
      replaceRow.hidden ? showReplace() : (replaceRow.hidden = true)),
    button("×", { tip: "Cerrar búsqueda", desc: "Oculta la barra de búsqueda.", keys: "Esc" }, () => {
      closeSearchPanel(view);
      view.focus();
    }),
  );
  replaceRow.append(
    replaceInput,
    button("Reemplazar", { tip: "Reemplazar", desc: "Reemplaza la coincidencia actual y pasa a la siguiente.", keys: "Enter" }, () => replaceNext(view), "cm-jv-btn cm-jv-text"),
    button("Todos", { tip: "Reemplazar todos", desc: "Reemplaza todas las coincidencias. Se puede deshacer." }, () => replaceAll(view), "cm-jv-btn cm-jv-text"),
  );
  dom.append(searchRow, replaceRow);

  return {
    dom,
    top: true,
    mount() {
      panels.set(view, { showReplace });
      refreshCount();
      // Con un panel propio, enfocar el campo al abrir le toca al panel (CodeMirror solo lo hace al reabrir).
      searchInput.focus();
      searchInput.select();
    },
    destroy() {
      panels.delete(view);
    },
    update(update: ViewUpdate) {
      const changed = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setSearchQuery)));
      if (changed) {
        const query = getSearchQuery(update.state);
        if (query.search !== searchInput.value) searchInput.value = query.search;
        if (query.replace !== replaceInput.value) replaceInput.value = query.replace;
      }
      if (changed || update.docChanged || update.selectionSet) refreshCount();
    },
  };
}

/** Ctrl+H: abre la búsqueda con la fila de reemplazo visible. */
export function openReplacePanel(view: EditorView): boolean {
  openSearchPanel(view);
  panels.get(view)?.showReplace();
  return true;
}
