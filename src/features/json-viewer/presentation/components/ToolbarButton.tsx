import type { LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  active?: boolean;
}

export function ToolbarButton({ icon: Icon, label, onClick, disabled, active }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-9 shrink-0 place-items-center rounded-md transition-colors hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-accent ${active ? "text-ok" : "text-muted"}`}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </button>
  );
}
