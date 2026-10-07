import {
  AlignLeft, Braces, Check, Copy, Download, FileJson, Layers, Minimize2,
  Quote, Redo2, Search, Share2, Trash2, Undo2, Upload,
} from "lucide-react";
import type { JsonDocumentVM } from "../hooks/useJsonDocument";
import { LanguageSwitch } from "./LanguageSwitch";
import { ModeTabs } from "./ModeTabs";
import { SortMenu } from "./SortMenu";
import { ToolbarButton } from "./ToolbarButton";

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;

interface ToolbarProps {
  vm: JsonDocumentVM["toolbar"];
  onUpload: () => void;
  onDownload: () => void;
}

export function Toolbar({ vm, onUpload, onDownload }: ToolbarProps) {
  const tips = vm.tips;
  return (
    // Si el panel es estrecho (móvil, tablet dividida), los botones siguen a las pestañas y bajan
    // a la fila siguiente en vez de ocultarse (`contents` los hace hijos directos del contenedor).
    <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-y-0.5 border-b border-border bg-panel pr-1">
      <ModeTabs mode={vm.mode} onChange={vm.setMode} treeDisabled={vm.isSql} treeTip={tips.tree} />
      <LanguageSwitch language={vm.isSql ? "sql" : "json"} onChange={vm.setLanguage} />
      <Divider />
      <nav className="contents" aria-label="Acciones">
        <ToolbarButton icon={FileJson} tip={tips.sample} onClick={vm.loadSample} />
        <ToolbarButton icon={Upload} tip={tips.upload} onClick={onUpload} />
        <ToolbarButton icon={Download} tip={tips.download} onClick={onDownload} disabled={!vm.hasText} />
        <ToolbarButton icon={vm.copied ? Check : Copy} tip={tips.copy} onClick={vm.copy} disabled={!vm.hasText} active={vm.copied} />
        {vm.canShare && (
          <ToolbarButton icon={vm.shared ? Check : Share2} tip={tips.share} onClick={vm.copyLink} disabled={!vm.hasText} active={vm.shared} />
        )}
        <ToolbarButton icon={Search} tip={tips.search} onClick={vm.openSearch} />
        <Divider />
        <ToolbarButton icon={AlignLeft} tip={tips.format} onClick={vm.format} disabled={!vm.canFormat} />
        <ToolbarButton icon={Layers} tip={tips.expandNested} onClick={vm.expandNested} disabled={!vm.isValid} />
        <SortMenu tip={tips.sort} disabled={!vm.isValid} onSort={vm.sort} context={vm.sortContext} />
        <ToolbarButton icon={Minimize2} tip={tips.minify} onClick={vm.minify} disabled={!vm.isValid} />
        <ToolbarButton icon={Quote} tip={tips.escape} onClick={vm.escape} disabled={!vm.isValid} />
        <ToolbarButton icon={Braces} tip={tips.unescape} onClick={vm.unescape} disabled={!vm.canUnescape} />
        <ToolbarButton icon={Trash2} tip={tips.clear} onClick={vm.clear} disabled={!vm.hasText} />
        <Divider />
        <ToolbarButton icon={Undo2} tip={tips.undo} onClick={vm.undo} disabled={!vm.canUndo} />
        <ToolbarButton icon={Redo2} tip={tips.redo} onClick={vm.redo} disabled={!vm.canRedo} />
      </nav>
    </div>
  );
}
