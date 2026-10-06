import { Braces, Columns2, GitCompareArrows, Lock, Moon, Sun, type LucideIcon } from "lucide-react";
import type { Theme } from "@/shared/theme/theme";

interface AppBarProps {
  isSplit: boolean;
  isDiff: boolean;
  theme: Theme;
  toggleSplit: () => void;
  toggleDiff: () => void;
  toggleTheme: () => void;
}

interface ToggleButtonProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

/** En pantallas pequeñas solo se ve el icono; el nombre sigue disponible por aria-label/title. */
function ToggleButton({ active, icon: Icon, label, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${active ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-fg"}`}
    >
      <Icon className="size-4 sm:size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function AppBar(vm: AppBarProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-bg px-3">
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold whitespace-nowrap">
        <Braces className="size-4 text-accent" /> JSON Viewer
      </span>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
      <ToggleButton active={vm.isSplit && !vm.isDiff} icon={Columns2} label="Dividir pantalla" onClick={vm.toggleSplit} />
      <ToggleButton active={vm.isDiff} icon={GitCompareArrows} label="Comparar" onClick={vm.toggleDiff} />
      <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted lg:flex">
        <Lock className="size-3.5" /> Todo se procesa en tu navegador
      </span>
      <button
        type="button"
        onClick={vm.toggleTheme}
        title={vm.theme === "dark" ? "Tema claro" : "Tema oscuro"}
        aria-label="Cambiar tema"
        className="ml-auto grid size-8 shrink-0 place-items-center rounded text-muted hover:bg-hover hover:text-fg lg:ml-0"
      >
        {vm.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}
