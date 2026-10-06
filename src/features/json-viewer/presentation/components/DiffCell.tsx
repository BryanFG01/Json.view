import type { DiffCellVM } from "../utils/diffView";
import { DIFF_CELL_CLASS, DIFF_SIGN, TOKEN_CLASS } from "../utils/styles.constants";

export function DiffCell({ cell }: { cell: DiffCellVM }) {
  return (
    <div className={`flex min-w-0 ${DIFF_CELL_CLASS[cell.kind]}`}>
      <span className="w-8 shrink-0 select-none pr-1.5 text-right text-gutter sm:w-12 sm:pr-2">{cell.number ?? ""}</span>
      <span className="w-3 shrink-0 select-none text-muted sm:w-4">{DIFF_SIGN[cell.kind]}</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-all pr-1.5 sm:pr-3">
        {cell.tokens.map((token, i) => (
          <span key={i} className={TOKEN_CLASS[token.type]}>{token.text}</span>
        ))}
      </span>
    </div>
  );
}
