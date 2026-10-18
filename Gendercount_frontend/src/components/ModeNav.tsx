import { ChevronLeft, ChevronRight } from "lucide-react";
import { MODE_ORDER, MODES, type InputMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ModeNavProps {
  mode: InputMode;
  onStep: (step: 1 | -1) => void;
}

/** Previous/next mode arrows and position dots, overlaid on an empty media area (parent must be `relative`). */
const ModeNav = ({ mode, onStep }: ModeNavProps) => {
  const index = MODE_ORDER.indexOf(mode);
  const neighbours = [
    { step: -1 as const, target: MODE_ORDER[index - 1], Icon: ChevronLeft, side: "left-3" },
    { step: 1 as const, target: MODE_ORDER[index + 1], Icon: ChevronRight, side: "right-3" },
  ];

  return (
    <>
      {neighbours.map(
        ({ step, target, Icon, side }) =>
          target && (
            <button
              key={step}
              type="button"
              onClick={() => onStep(step)}
              aria-label={`Switch to ${MODES[target].label}`}
              title={MODES[target].label}
              className={cn(
                "absolute top-1/2 z-10 flex h-10 -translate-y-1/2 items-center gap-1 rounded-full border bg-card/80 px-2.5 text-xs font-medium text-muted-foreground shadow-md backdrop-blur transition-colors",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                side,
              )}
            >
              {step === 1 && <span className="hidden sm:inline">{MODES[target].label}</span>}
              <Icon className="h-4 w-4" />
              {step === -1 && <span className="hidden sm:inline">{MODES[target].label}</span>}
            </button>
          ),
      )}

      <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
        {MODE_ORDER.map((item) => (
          <span
            key={item}
            className={cn("h-1.5 rounded-full transition-all", item === mode ? "w-5 bg-accent" : "w-1.5 bg-muted-foreground/40")}
          />
        ))}
      </div>
    </>
  );
};

export default ModeNav;
