"use client";

import { AppBar } from "./components/AppBar";
import { DiffView } from "./components/DiffView";
import { JsonPane } from "./components/JsonPane";
import { useJsonViewer } from "./hooks/useJsonViewer";

export function JsonViewerPage() {
  const vm = useJsonViewer();

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <AppBar {...vm.appBar} />
      {vm.isDiff ? (
        <DiffView {...vm.diff} />
      ) : (
        <main className="flex min-h-0 flex-1 flex-col md:flex-row">
          <JsonPane doc={vm.left} label="Panel izquierdo" />
          {vm.isSplit && (
            <JsonPane doc={vm.right} label="Panel derecho" className="border-t border-border md:border-t-0 md:border-l" />
          )}
        </main>
      )}
    </div>
  );
}
