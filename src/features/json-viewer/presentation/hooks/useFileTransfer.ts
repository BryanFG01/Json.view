"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { downloadText, DOWNLOAD_FILENAME } from "../utils/fileIO";

interface FileTransferParams {
  text: string;
  onLoad: (text: string) => void;
}

/** Subir (selector o arrastrar y soltar) y descargar archivos. Todo local, con FileReader/Blob. */
export function useFileTransfer({ text, onLoad }: FileTransferParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  const readFile = useCallback((file: File | undefined) => {
    file?.text().then(onLoad).catch(() => undefined);
  }, [onLoad]);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    readFile(event.target.files?.[0]);
    event.target.value = "";
  }, [readFile]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    readFile(event.dataTransfer.files[0]);
  }, [readFile]);

  return {
    inputRef,
    isDragging,
    onFileChange,
    onDragOver,
    onDrop,
    onDragLeave: () => setDragging(false),
    openPicker: () => inputRef.current?.click(),
    download: () => downloadText(DOWNLOAD_FILENAME, text),
  };
}
