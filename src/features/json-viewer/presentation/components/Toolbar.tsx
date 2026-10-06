import {
  AlignLeft, Braces, Check, Copy, Download, FileJson, Layers, Minimize2,
  Quote, Redo2, Share2, Trash2, Undo2, Upload,
} from "lucide-react";
import type { JsonDocumentVM } from "../hooks/useJsonDocument";
import { ModeTabs } from "./ModeTabs";
import { ToolbarButton } from "./ToolbarButton";

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;

interface ToolbarProps {
  vm: JsonDocumentVM["toolbar"];
  onUpload: () => void;
  onDownload: () => void;
}

export function Toolbar({ vm, onUpload, onDownload }: ToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center border-b border-border bg-panel">
      <ModeTabs mode={vm.mode} onChange={vm.setMode} />
      <Divider />
      <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none]" aria-label="Acciones">
        <ToolbarButton icon={FileJson} label="Cargar ejemplo" onClick={vm.loadSample} />
        <ToolbarButton icon={Upload} label="Subir archivo" onClick={onUpload} />
        <ToolbarButton icon={Download} label="Descargar" onClick={onDownload} disabled={!vm.hasText} />
        <ToolbarButton icon={vm.copied ? Check : Copy} label="Copiar" onClick={vm.copy} disabled={!vm.hasText} active={vm.copied} />
        {vm.canShare && (
          <ToolbarButton icon={vm.shared ? Check : Share2} label="Copiar enlace para compartir" onClick={vm.copyLink} disabled={!vm.hasText} active={vm.shared} />
        )}
        <Divider />
        <ToolbarButton icon={AlignLeft} label="Formatear (Shift+Alt+F)" onClick={vm.format} disabled={!vm.isValid} />
        <ToolbarButton icon={Layers} label="Analizar JSON anidado y formatear" onClick={vm.expandNested} disabled={!vm.isValid} />
        <ToolbarButton icon={Minimize2} label="Minificar" onClick={vm.minify} disabled={!vm.isValid} />
        <ToolbarButton icon={Quote} label="Escapar como string" onClick={vm.escape} disabled={!vm.isValid} />
        <ToolbarButton icon={Braces} label="Desescapar string a JSON" onClick={vm.unescape} disabled={!vm.canUnescape} />
        <ToolbarButton icon={Trash2} label="Limpiar" onClick={vm.clear} disabled={!vm.hasText} />
        <Divider />
        <ToolbarButton icon={Undo2} label="Deshacer (Ctrl+Z)" onClick={vm.undo} disabled={!vm.canUndo} />
        <ToolbarButton icon={Redo2} label="Rehacer (Ctrl+Y)" onClick={vm.redo} disabled={!vm.canRedo} />
      </nav>
    </div>
  );
}
