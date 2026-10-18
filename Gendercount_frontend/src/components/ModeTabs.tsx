import { MODE_ORDER, MODES, type InputMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ModeTabsProps {
  activeMode: InputMode;
  onModeChange: (mode: InputMode) => void;
  className?: string;
}

const ModeTabs = ({ activeMode, onModeChange, className }: ModeTabsProps) => (
  <nav aria-label="Input mode" className={cn("flex gap-1 rounded-full border bg-muted/70 p-1 backdrop-blur", className)}>
    {MODE_ORDER.map((mode) => {
      const { label, icon: Icon } = MODES[mode];
      const isActive = activeMode === mode;
      return (
        <button
          key={mode}
          type="button"
          onClick={() => onModeChange(mode)}
          aria-pressed={isActive}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all sm:flex-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isActive
              ? "bg-gradient-to-r from-primary to-primary-end text-primary-foreground shadow-md shadow-primary/30"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      );
    })}
  </nav>
);

export default ModeTabs;
