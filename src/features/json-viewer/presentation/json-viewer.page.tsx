"use client";

import { Tooltip } from "@/shared/tooltip/Tooltip";
import { AppBar } from "./components/AppBar";
import { DiffView } from "./components/DiffView";
import { JsonPane } from "./components/JsonPane";
import { useJsonViewer } from "./hooks/useJsonViewer";

export function JsonViewerPage() {
  const vm = useJsonViewer();

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <AppBar {...vm.appBar} />
      <Tooltip />
      {vm.isDiff ? (
        <DiffView {...vm.diff} />
      ) : (
        <main className="flex min-h-0 flex-1 flex-col landscape:flex-row md:flex-row">
          {/* Apilados solo en vertical y estrecho; en horizontal (móvil girado) o ≥ md, lado a lado. */}
          <JsonPane doc={vm.left} label="Panel izquierdo" />
          {vm.isSplit && (
            <JsonPane
              doc={vm.right}
              label="Panel derecho"
              className="border-t border-border landscape:border-t-0 landscape:border-l md:border-t-0 md:border-l"
            />
          )}
        </main>
      )}
    </div>
  );
}
