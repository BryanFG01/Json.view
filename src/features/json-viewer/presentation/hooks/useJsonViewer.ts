"use client";

import { useCallback, useState } from "react";
import { useTheme } from "@/shared/theme/useTheme";
import { useEscapeKey } from "./useEscapeKey";
import { useFindShortcut } from "./useFindShortcut";
import { useJsonDocument } from "./useJsonDocument";

/** Hook controlador de la página: dos documentos, pantalla dividida, comparación y tema. */
export function useJsonViewer() {
  const left = useJsonDocument({ shareable: true, autoFocus: true });
  const right = useJsonDocument();
  const [isSplit, setSplit] = useState(false);
  const [isDiff, setDiff] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const closeDiff = useCallback(() => setDiff(false), []);
  useEscapeKey(isDiff, closeDiff);
  useFindShortcut({ left: left.openSearch, right: isSplit ? right.openSearch : null, enabled: !isDiff });

  return {
    left,
    right,
    isSplit,
    isDiff,
    appBar: {
      isSplit,
      isDiff,
      theme,
      toggleTheme,
      toggleSplit: () => setSplit((value) => !value),
      toggleDiff: () => {
        setSplit(true);
        setDiff((value) => !value);
      },
    },
    diff: {
      left: { text: left.text, parsed: left.parsed, language: left.language, dialect: left.dialect },
      right: { text: right.text, parsed: right.parsed, language: right.language, dialect: right.dialect },
      onClose: closeDiff,
    },
  };
}
