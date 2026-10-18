import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  showLabel?: boolean; // visible label above the field (otherwise the placeholder acts as the label)
}

/** Text input with an icon, an inline error and (for passwords) a show/hide toggle. */
const TextField = ({ id, label, icon: Icon, error, showLabel = false, type = "text", className, ...props }: TextFieldProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={className}>
      <label htmlFor={id} className={showLabel ? "mb-1.5 block px-4 text-xs font-medium text-muted-foreground" : "sr-only"}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={isPassword && isRevealed ? "text" : type}
          placeholder={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-11 w-full rounded-full border bg-background/60 pl-11 text-sm outline-none transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70",
            "focus:border-accent focus:ring-2 focus:ring-ring/30",
            isPassword ? "pr-11" : "pr-4",
            error && "border-destructive focus:border-destructive focus:ring-destructive/30",
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((revealed) => !revealed)}
            aria-label={isRevealed ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 px-4 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextField;
