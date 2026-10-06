"use client";

import { useJsonEditor, type JsonEditorProps } from "../hooks/useJsonEditor";
import { EDITOR_TEXT_CLASS, TOKEN_CLASS } from "../utils/styles.constants";
import { ErrorBanner } from "./ErrorBanner";

export function JsonEditor(props: JsonEditorProps) {
  const { gutterRef, highlightRef, textareaRef, ...vm } = useJsonEditor(props);

  return (
    <div className="flex h-full flex-col">
      {vm.error && <ErrorBanner error={vm.error} onGoToError={vm.canGoToError ? vm.goToError : undefined} />}
      <div className="flex min-h-0 flex-1">
        <pre
          ref={gutterRef}
          aria-hidden
          style={{ width: vm.gutterWidth }}
          className={`${EDITOR_TEXT_CLASS} relative shrink-0 select-none overflow-hidden pr-3 pb-16 text-right text-gutter`}
        >
          {vm.errorMarkerStyle && <span className="absolute inset-x-0 bg-err/20" style={vm.errorMarkerStyle} />}
          <span className="relative">{vm.gutterText}</span>
        </pre>
        <div className="relative min-w-0 flex-1">
          <pre
            ref={highlightRef}
            aria-hidden
            className={`${EDITOR_TEXT_CLASS} pointer-events-none absolute inset-0 overflow-hidden px-3 pb-16 text-fg`}
          >
            {vm.errorMarkerStyle && <span className="absolute inset-x-0 bg-err/10" style={vm.errorMarkerStyle} />}
            <span className="relative">
              {vm.tokens.map((token, i) => (
                <span key={i} className={TOKEN_CLASS[token.type]}>{token.text}</span>
              ))}
              {"\n"}
            </span>
          </pre>
          <textarea
            ref={textareaRef}
            value={props.text}
            onChange={vm.onChange}
            onKeyDown={vm.onKeyDown}
            onScroll={vm.onScroll}
            onPaste={vm.onPaste}
            wrap="off"
            spellCheck={false}
            autoFocus={vm.autoFocus}
            aria-label="Editor JSON"
            placeholder="Pega, escribe o arrastra aquí tu JSON…"
            className={`${EDITOR_TEXT_CLASS} absolute inset-0 size-full resize-none overflow-auto bg-transparent px-3 pb-3 text-transparent caret-fg outline-none selection:bg-accent/30 placeholder:text-muted`}
          />
        </div>
      </div>
    </div>
  );
}
