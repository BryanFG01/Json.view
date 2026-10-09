import { Braces, Columns2, GitCompareArrows, Lock, Moon, Sun, type LucideIcon } from "lucide-react";
import { GithubMark } from "@/shared/components/GithubMark";
import { REPO_URL } from "@/shared/config/links";
import type { Theme } from "@/shared/theme/theme";
import { tipAttrs, type Tip } from "@/shared/tooltip/tip";
import { TIPS } from "../utils/tooltips.constants";

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
  tip: Tip;
  onClick: () => void;
}

/** En pantallas pequeñas solo se ve el icono; el nombre sigue disponible por aria-label y tooltip. */
function ToggleButton({ active, icon: Icon, tip, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={tip.title}
      onClick={onClick}
      {...tipAttrs(tip)}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${active ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-fg"}`}
    >
      <Icon className="size-4 sm:size-3.5" />
      <span className="hidden sm:inline">{tip.title}</span>
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
      <ToggleButton active={vm.isSplit && !vm.isDiff} icon={Columns2} tip={TIPS.split} onClick={vm.toggleSplit} />
      <ToggleButton active={vm.isDiff} icon={GitCompareArrows} tip={TIPS.compare} onClick={vm.toggleDiff} />
      <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted lg:flex">
        <Lock className="size-3.5" /> Todo se procesa en tu navegador
      </span>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={TIPS.repo.title}
        {...tipAttrs(TIPS.repo)}
        className="ml-auto grid size-8 shrink-0 place-items-center rounded text-muted hover:bg-hover hover:text-fg lg:ml-0"
      >
        <GithubMark className="size-4" />
      </a>
      <button
        type="button"
        onClick={vm.toggleTheme}
        aria-label={TIPS.theme.title}
        {...tipAttrs(TIPS.theme)}
        className="grid size-8 shrink-0 place-items-center rounded text-muted hover:bg-hover hover:text-fg"
      >
        {vm.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}
