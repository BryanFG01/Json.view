import { CircleAlert } from "lucide-react";
import type { JsonSyntaxError } from "../../domain/models/json";

interface ErrorBannerProps {
  error: JsonSyntaxError;
  onGoToError?: () => void;
}

export function ErrorBanner({ error, onGoToError }: ErrorBannerProps) {
  return (
    <div role="alert" className="flex items-center gap-2 border-b border-err/30 bg-err/10 px-3 py-1.5 text-xs text-err">
      <CircleAlert className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate font-mono" title={error.message}>
        {error.location && <strong className="mr-2">Línea {error.location.line}, columna {error.location.column}:</strong>}
        {error.message}
      </span>
      {onGoToError && (
        <button type="button" onClick={onGoToError} className="shrink-0 rounded px-2 py-0.5 font-semibold hover:bg-err/15">
          Ir al error
        </button>
      )}
    </div>
  );
}
