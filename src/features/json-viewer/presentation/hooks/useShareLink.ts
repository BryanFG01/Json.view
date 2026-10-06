"use client";

import { useCallback, useEffect } from "react";
import { buildShareUrl, decodeShareHash, encodeShareHash } from "../utils/shareLink";
import { useClipboard } from "./useClipboard";

interface ShareLinkParams {
  text: string;
  onLoad: (text: string) => void;
  enabled: boolean;
}

/** Comparte el JSON en el #hash de la URL y lo carga al abrir un enlace compartido. */
export function useShareLink({ text, onLoad, enabled }: ShareLinkParams) {
  const clipboard = useClipboard();
  const { copy } = clipboard;

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!enabled || !hash) return;
    decodeShareHash(hash).then(onLoad).catch(() => undefined);
  }, [enabled, onLoad]);

  const copyLink = useCallback(async () => {
    if (!enabled || !text) return;
    const url = buildShareUrl(await encodeShareHash(text));
    window.history.replaceState(null, "", url);
    await copy(url);
  }, [enabled, text, copy]);

  return { copyLink, shared: clipboard.copied };
}
