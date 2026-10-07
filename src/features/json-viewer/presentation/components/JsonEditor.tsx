"use client";

import { useJsonEditor, type JsonEditorProps } from "../hooks/useJsonEditor";
import { ErrorBanner } from "./ErrorBanner";

export function JsonEditor(props: JsonEditorProps) {
  const { containerRef, ...vm } = useJsonEditor(props);

  return (
    <div className="flex h-full flex-col">
      {vm.error && <ErrorBanner error={vm.error} onGoToError={vm.goToError} action={vm.errorAction} />}
      <div ref={containerRef} className="min-h-0 flex-1" />
    </div>
  );
}
