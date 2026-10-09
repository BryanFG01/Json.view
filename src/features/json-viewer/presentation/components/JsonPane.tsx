"use client";

import { FileUp, Loader2, TriangleAlert, X } from "lucide-react";
import type { JsonDocumentVM } from "../hooks/useJsonDocument";
import { useFileTransfer } from "../hooks/useFileTransfer";
import type { PaneId } from "../hooks/useFindShortcut";
import { useSqliteSource } from "../hooks/useSqliteSource";
import { ACCEPTED_FILES } from "../utils/fileIO";
import { DatabaseBar } from "./DatabaseBar";
import { JsonEditor } from "./JsonEditor";
import { StatusBar } from "./StatusBar";
import { Toolbar } from "./Toolbar";
import { TreeView } from "./TreeView";

interface JsonPaneProps {
  doc: JsonDocumentVM;
  /** Identifica el panel para dirigir Ctrl+F a su propio buscador. */
  id: PaneId;
  label: string;
  className?: string;
}

/** Un panel completo: barra de acciones, base SQLite (si hay), editor o árbol, estado y subidas. */
export function JsonPane({ doc, id, label, className = "" }: JsonPaneProps) {
  const source = useSqliteSource({ loadText: doc.loadText, showJson: doc.showJson, showSql: doc.showSql });
  const { inputRef, ...files } = useFileTransfer({ text: doc.text, language: doc.language, onFiles: source.handleFiles });

  return (
    <section aria-label={label} data-pane={id} className={`flex min-h-0 min-w-0 flex-1 flex-col ${className}`}>
      <Toolbar vm={doc.toolbar} onUpload={files.openPicker} onDownload={files.download} />
      {source.isOpen && <DatabaseBar vm={source} />}
      {source.notice && (
        <div role="alert" className="flex items-center gap-2 border-b border-tok-keyword/30 bg-tok-keyword/10 px-3 py-1.5 text-xs text-fg">
          <TriangleAlert className="size-4 shrink-0 text-tok-keyword" />
          <span className="min-w-0 flex-1">{source.notice}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={source.dismissNotice} className="grid size-5 place-items-center rounded hover:bg-hover">
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div
        className="relative min-h-0 flex-1"
        onDragOver={files.onDragOver}
        onDragLeave={files.onDragLeave}
        onDrop={files.onDrop}
      >
        {doc.mode === "editor" ? <JsonEditor {...doc.editor} /> : <TreeView parsed={doc.parsed} />}
        {files.isDragging && (
          <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-accent/10 text-accent">
            <span className="flex items-center gap-2 font-semibold"><FileUp className="size-5" /> Suelta el archivo (JSON, SQL, .db o .zip)</span>
          </div>
        )}
        {source.opening && (
          <div role="status" className="absolute inset-0 grid place-items-center bg-bg/70 text-sm text-fg">
            <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Abriendo base de datos…</span>
          </div>
        )}
      </div>
      <StatusBar vm={doc.status} />
      <input ref={inputRef} type="file" accept={ACCEPTED_FILES} multiple hidden onChange={files.onFileChange} />
    </section>
  );
}
