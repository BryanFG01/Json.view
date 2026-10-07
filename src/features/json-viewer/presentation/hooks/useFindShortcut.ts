"use client";

import { useEffect, useRef } from "react";

export type PaneId = "left" | "right";

interface FindTargets {
  left: () => void;
  /** null cuando la pantalla no está dividida. */
  right: (() => void) | null;
  /** En Comparar no hay editores: Ctrl+F se deja al navegador. */
  enabled: boolean;
}

const paneOf = (node: EventTarget | null): PaneId | undefined =>
  node instanceof Element ? (node.closest<HTMLElement>("[data-pane]")?.dataset.pane as PaneId | undefined) : undefined;

const isFindShortcut = (event: KeyboardEvent) =>
  (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "f";

/**
 * Ctrl+F abre el buscador del panel donde está trabajando el usuario (el que tiene el foco
 * o el último donde hizo clic), en vez del buscador del navegador. Dentro del editor lo
 * resuelve CodeMirror directamente.
 */
export function useFindShortcut(targets: FindTargets) {
  const targetsRef = useRef(targets);
  const lastPane = useRef<PaneId>("left");

  useEffect(() => {
    targetsRef.current = targets;
  });

  useEffect(() => {
    const remember = (event: Event) => {
      const pane = paneOf(event.target);
      if (pane) lastPane.current = pane;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const { left, right, enabled } = targetsRef.current;
      if (!enabled || !isFindShortcut(event)) return;
      if (event.target instanceof Element && event.target.closest(".cm-editor")) return;
      const pane = paneOf(document.activeElement) ?? lastPane.current;
      event.preventDefault();
      (pane === "right" && right ? right : left)();
    };
    document.addEventListener("pointerdown", remember, true);
    document.addEventListener("focusin", remember);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", remember, true);
      document.removeEventListener("focusin", remember);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
