"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useClipboard(resetMs = 1200) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
    } catch {
      setCopied(false);
    }
  }, [resetMs]);

  return { copied, copy };
}
