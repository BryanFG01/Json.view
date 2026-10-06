import { Braces, Columns2, GitCompareArrows, Lock, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import type { Theme } from "@/shared/theme/theme";

interface AppBarProps {
  isSplit: boolean;
  isDiff: boolean;
  theme: Theme;
  toggleSplit: () => void;
  toggleDiff: () => void;
  toggleTheme: () => void;
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${active ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

export function AppBar(vm: AppBarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-bg px-3">
      <span className="flex items-center gap-1.5 text-sm font-bold"><Braces className="size-4 text-accent" /> JSON Viewer</span>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToggleButton active={vm.isSplit && !vm.isDiff} onClick={vm.toggleSplit}>
        <Columns2 className="size-3.5" /> Dividir pantalla
      </ToggleButton>
      <ToggleButton active={vm.isDiff} onClick={vm.toggleDiff}>
        <GitCompareArrows className="size-3.5" /> Comparar
      </ToggleButton>
      <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted md:flex">
        <Lock className="size-3.5" /> Todo se procesa en tu navegador
      </span>
      <button
        type="button"
        onClick={vm.toggleTheme}
        title={vm.theme === "dark" ? "Tema claro" : "Tema oscuro"}
        aria-label="Cambiar tema"
        className="ml-auto grid size-7 place-items-center rounded text-muted hover:bg-hover hover:text-fg md:ml-0"
      >
        {vm.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}
