export type DiffOpType = "equal" | "insert" | "delete";

export interface DiffOp {
  type: DiffOpType;
  text: string;
}
