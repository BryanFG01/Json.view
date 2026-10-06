export const ACCEPTED_FILES = ".json,.txt,application/json,text/plain";
export const DOWNLOAD_FILENAME = "data.json";

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
