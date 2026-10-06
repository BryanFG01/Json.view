"use client";

import { useEffect, useState } from "react";
import { readTooltip, type TooltipState } from "./tip";

/** Espera antes del primer tooltip; si ya hay uno visible, el siguiente aparece al instante. */
const SHOW_DELAY_MS = 150;

/**
 * Un único tooltip para toda la página: escucha el puntero y el foco sobre cualquier elemento
 * con `data-tip`, en lugar de montar un tooltip por botón.
 */
export function useTooltip() {
  const [tip, setTip] = useState<TooltipState | null>(null);

  useEffect(() => {
    let current: HTMLElement | null = null;
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const hide = () => {
      clearTimeout(timer);
      current = null;
      visible = false;
      setTip(null);
    };
    const show = (el: HTMLElement) => {
      clearTimeout(timer);
      current = el;
      timer = setTimeout(() => {
        visible = true;
        setTip(readTooltip(el));
      }, visible ? 0 : SHOW_DELAY_MS);
    };
    const target = (event: Event) => (event.target as Element | null)?.closest?.<HTMLElement>("[data-tip]") ?? null;

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const el = target(event);
      if (el === current) return;
      if (el) show(el);
      else hide();
    };
    const onFocusIn = (event: FocusEvent) => {
      const el = target(event);
      if (el && (event.target as HTMLElement).matches(":focus-visible")) show(el);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && hide();

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, []);

  return tip;
}
