"use client";

import { useCallback, useSyncExternalStore } from "react";
import { applyTheme, DEFAULT_THEME, readTheme, THEME_CHANGE_EVENT, type Theme } from "./theme";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

const getServerTheme = (): Theme => DEFAULT_THEME;

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);
  const toggleTheme = useCallback(() => applyTheme(theme === "dark" ? "light" : "dark"), [theme]);
  return { theme, toggleTheme };
}
