"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { DocLanguage } from "../../domain/models/json";
import type { FileEntry } from "../../application/useCases/zipFile";
import { downloadText } from "../utils/fileIO";

interface FileTransferParams {
  text: string;
  language: DocLanguage;
  /**
   * Recibe los archivos como bytes (no como texto): pueden ser una base SQLite, un .zip o texto
   * en UTF-16 / ANSI. Varios a la vez para subir juntos un .db y su .db-wal.
   */
  onFiles: (files: FileEntry[]) => void;
}

async function readAll(list: FileList | null | undefined): Promise<FileEntry[]> {
  const files = Array.from(list ?? []);
  return Promise.all(files.map(async (file) => ({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })));
}

/** Subir (selector o arrastrar y soltar) y descargar archivos. Todo local, en el navegador. */
export function useFileTransfer({ text, language, onFiles }: FileTransferParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  const receive = useCallback((list: FileList | null | undefined) => {
    readAll(list)
      .then((files) => {
        if (files.length > 0) onFiles(files);
      })
      .catch(() => undefined);
  }, [onFiles]);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    receive(event.target.files);
    event.target.value = "";
  }, [receive]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    receive(event.dataTransfer.files);
  }, [receive]);

  return {
    inputRef,
    isDragging,
    onFileChange,
    onDragOver,
    onDrop,
    onDragLeave: () => setDragging(false),
    openPicker: () => inputRef.current?.click(),
    download: () => downloadText(language, text),
  };
}
