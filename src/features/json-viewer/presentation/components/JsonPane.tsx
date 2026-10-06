"use client";

import { FileUp } from "lucide-react";
import type { JsonDocumentVM } from "../hooks/useJsonDocument";
import { useFileTransfer } from "../hooks/useFileTransfer";
import { ACCEPTED_FILES } from "../utils/fileIO";
import { JsonEditor } from "./JsonEditor";
import { StatusBar } from "./StatusBar";
import { Toolbar } from "./Toolbar";
import { TreeView } from "./TreeView";

interface JsonPaneProps {
  doc: JsonDocumentVM;
  className?: string;
}

/** Un panel completo: barra de acciones, editor o árbol, barra de estado y subida de archivos. */
export function JsonPane({ doc, className = "" }: JsonPaneProps) {
  const { inputRef, ...files } = useFileTransfer({ text: doc.text, onLoad: doc.replace });

  return (
    <section className={`flex min-h-0 min-w-0 flex-1 flex-col ${className}`}>
      <Toolbar vm={doc.toolbar} onUpload={files.openPicker} onDownload={files.download} />
      <div
        className="relative min-h-0 flex-1"
        onDragOver={files.onDragOver}
        onDragLeave={files.onDragLeave}
        onDrop={files.onDrop}
      >
        {doc.mode === "editor" ? <JsonEditor {...doc.editor} /> : <TreeView parsed={doc.parsed} />}
        {files.isDragging && (
          <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-accent/10 text-accent">
            <span className="flex items-center gap-2 font-semibold"><FileUp className="size-5" /> Suelta el archivo JSON</span>
          </div>
        )}
      </div>
      <StatusBar vm={doc.status} />
      <input ref={inputRef} type="file" accept={ACCEPTED_FILES} hidden onChange={files.onFileChange} />
    </section>
  );
}
