import { matchBrackets, syntaxTree } from "@codemirror/language";
import { RangeSet, StateField, type EditorState, type Range } from "@codemirror/state";
import { GutterMarker, gutterLineClass } from "@codemirror/view";

/**
 * Bloque { } / [ ] del cursor, pintado en la columna de números:
 * - "fuerte": el cursor está junto a una llave → apertura y cierre resaltados + barra entre ambos.
 * - "suave": el cursor está dentro de un bloque → marca discreta del bloque que lo contiene.
 */
export interface BracketScope {
  openLine: number;
  closeLine: number;
  /** Posición de la llave de apertura y de la de cierre (para copiar el bloque). */
  from: number;
  to: number;
  strong: boolean;
}

/** Por encima de esto solo se marcan las líneas de apertura y cierre (bloques enormes). */
const MAX_MARKED_LINES = 3000;

class LineClass extends GutterMarker {
  constructor(readonly elementClass: string) {
    super();
  }
}
const MARKERS = {
  strong: { edge: new LineClass("cm-scope-edge"), mid: new LineClass("cm-scope-mid") },
  soft: { edge: new LineClass("cm-scope-edge-soft"), mid: new LineClass("cm-scope-mid-soft") },
};

/**
 * Llave junto al cursor y su pareja. Mismo orden que `bracketMatching` de CodeMirror:
 * cierre antes del cursor, apertura antes, apertura después, cierre después.
 */
function bracketPair(state: EditorState, pos: number): [number, number] | null {
  const probes: [number, -1 | 1][] = [[pos, -1], [pos - 1, 1], [pos, 1], [pos + 1, -1]];
  for (const [at, dir] of probes) {
    if (at < 0 || at > state.doc.length) continue;
    const match = matchBrackets(state, at, dir);
    if (match?.matched && match.end) {
      return [Math.min(match.start.from, match.end.from), Math.max(match.start.from, match.end.from)];
    }
  }
  return null;
}

/** Objeto o array más interno que contiene al cursor. */
function enclosingBlock(state: EditorState, pos: number): [number, number] | null {
  for (let node: ReturnType<typeof syntaxTree>["topNode"] | null = syntaxTree(state).resolveInner(pos, -1); node; node = node.parent) {
    if ((node.name === "Object" || node.name === "Array") && node.to - node.from > 1) return [node.from, node.to - 1];
  }
  return null;
}

export function findScope(state: EditorState): BracketScope | null {
  const pos = state.selection.main.head;
  const pair = bracketPair(state, pos);
  const range = pair ?? enclosingBlock(state, pos);
  if (!range) return null;
  const [from, to] = range;
  return { openLine: state.doc.lineAt(from).number, closeLine: state.doc.lineAt(to).number, from, to, strong: pair !== null };
}

function buildMarkers(state: EditorState, scope: BracketScope | null): RangeSet<GutterMarker> {
  if (!scope || (scope.openLine === scope.closeLine && !scope.strong)) return RangeSet.empty;
  const { edge, mid } = scope.strong ? MARKERS.strong : MARKERS.soft;
  const lineStart = (n: number) => state.doc.line(n).from;
  const ranges: Range<GutterMarker>[] = [edge.range(lineStart(scope.openLine))];
  if (scope.closeLine - scope.openLine <= MAX_MARKED_LINES) {
    for (let n = scope.openLine + 1; n < scope.closeLine; n++) ranges.push(mid.range(lineStart(n)));
  }
  if (scope.closeLine !== scope.openLine) ranges.push(edge.range(lineStart(scope.closeLine)));
  return RangeSet.of(ranges);
}

const sameScope = (a: BracketScope | null, b: BracketScope | null) =>
  a?.from === b?.from && a?.to === b?.to && a?.strong === b?.strong;

interface ScopeState {
  scope: BracketScope | null;
  markers: RangeSet<GutterMarker>;
}

export const bracketScopeField = StateField.define<ScopeState>({
  create(state) {
    const scope = findScope(state);
    return { scope, markers: buildMarkers(state, scope) };
  },
  update(value, tr) {
    if (!tr.selection && !tr.docChanged) return value;
    const scope = findScope(tr.state);
    if (!tr.docChanged && sameScope(scope, value.scope)) return value;
    return { scope, markers: buildMarkers(tr.state, scope) };
  },
  provide: (field) => gutterLineClass.from(field, (value) => value.markers),
});
