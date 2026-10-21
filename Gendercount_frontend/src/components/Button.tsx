import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-primary to-primary-end text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110",
  destructive: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:brightness-110",
  outline: "border bg-card/70 text-foreground backdrop-blur hover:bg-muted",
  // Tinted secondary actions that sit next to a primary button
  softSuccess: "border border-success/30 bg-success/10 text-success hover:border-success/50 hover:bg-success/20",
  softDestructive:
    "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
};

const SIZES = {
  default: "h-11 px-5 text-sm [&_svg]:size-5",
  icon: "h-11 w-11 [&_svg]:size-5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

const Button = ({ variant = "primary", size = "default", className, type = "button", ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...props}
  />
);

export default Button;
