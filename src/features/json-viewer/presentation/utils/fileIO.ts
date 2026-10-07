import type { DocLanguage } from "../../domain/models/json";

export const ACCEPTED_FILES = ".json,.sql,.txt,application/json,application/sql,text/plain";

const DOWNLOAD: Record<DocLanguage, { filename: string; type: string }> = {
  json: { filename: "data.json", type: "application/json" },
  sql: { filename: "consulta.sql", type: "application/sql" },
};

export function downloadText(language: DocLanguage, text: string): void {
  const { filename, type } = DOWNLOAD[language];
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
