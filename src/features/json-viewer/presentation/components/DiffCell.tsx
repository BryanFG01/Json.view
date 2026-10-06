import type { DiffCellVM } from "../utils/diffRows";
import { DIFF_CELL_CLASS, DIFF_SIGN, TOKEN_CLASS } from "../utils/styles.constants";

export function DiffCell({ cell }: { cell: DiffCellVM }) {
  return (
    <div className={`flex min-w-0 ${DIFF_CELL_CLASS[cell.kind]}`}>
      <span className="w-12 shrink-0 select-none pr-2 text-right text-gutter">{cell.number ?? ""}</span>
      <span className="w-4 shrink-0 select-none text-muted">{DIFF_SIGN[cell.kind]}</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-all pr-3">
        {cell.tokens.map((token, i) => (
          <span key={i} className={TOKEN_CLASS[token.type]}>{token.text}</span>
        ))}
      </span>
    </div>
  );
}
