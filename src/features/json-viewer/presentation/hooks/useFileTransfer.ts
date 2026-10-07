"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { DocLanguage } from "../../domain/models/json";
import { downloadText } from "../utils/fileIO";

interface FileTransferParams {
  text: string;
  language: DocLanguage;
  /** Recibe también el nombre del archivo (la extensión .sql/.json ayuda a elegir el modo). */
  onLoad: (text: string, fileName: string) => void;
}

/** Subir (selector o arrastrar y soltar) y descargar archivos. Todo local, con FileReader/Blob. */
export function useFileTransfer({ text, language, onLoad }: FileTransferParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  const readFile = useCallback((file: File | undefined) => {
    file?.text().then((content) => onLoad(content, file.name)).catch(() => undefined);
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
    download: () => downloadText(language, text),
  };
}
