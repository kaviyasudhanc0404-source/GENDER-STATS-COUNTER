import type { FormEvent } from "react";
import { Loader2, Lock, Mail, ScanFace, User } from "lucide-react";
import Button from "@/components/Button";
import FormError from "@/components/FormError";
import GoogleLogo from "@/components/GoogleLogo";
import Modal from "@/components/Modal";
import TextField from "@/components/TextField";
import type { AuthMode } from "@/hooks/use-auth";
import { useAuthAction } from "@/hooks/use-auth-action";
import { useFormFields } from "@/hooks/use-form-fields";
import { cn } from "@/lib/utils";
import { compact, isValidEmail, nameError, newPasswordErrors } from "@/lib/validation";

export interface AuthActions {
  google: () => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface AuthDialogProps {
  mode: AuthMode | null; // null = closed
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  actions: AuthActions;
}

const COPY: Record<AuthMode, { title: string; subtitle: string; tab: string; submit: string; google: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to analyse photos, videos and your live camera.",
    tab: "Log in",
    submit: "Log in",
    google: "Continue with Google",
  },
  signup: {
    title: "Create your account",
    subtitle: "Sign up free to start counting people by gender.",
    tab: "Sign up",
    submit: "Create account",
    google: "Sign up with Google",
  },
};

type Values = { name: string; email: string; password: string; confirm: string };

const validate = (mode: AuthMode, { name, email, password, confirm }: Values) =>
  compact({
    email: isValidEmail(email) ? undefined : "Enter a valid email address.",
    ...(mode === "signup"
      ? { name: nameError(name), ...newPasswordErrors(password, confirm) }
      : { password: password ? undefined : "Enter your password." }),
  });

/** Dialog content; mounted each time the dialog opens, so the form always starts empty. */
const AuthPanel = ({ mode, onModeChange, actions }: Omit<AuthDialogProps, "mode" | "onClose"> & { mode: AuthMode }) => {
  const { values, setErrors, field, check } = useFormFields<Values>({ name: "", email: "", password: "", confirm: "" });
  const { busy, error, setError, run } = useAuthAction<"form" | "google" | "reset">();
  const copy = COPY[mode];

  const switchMode = (next: AuthMode) => {
    setErrors({});
    setError(null);
    onModeChange(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!check(validate(mode, values))) return;
    const email = values.email.trim();
    void run("form", () =>
      mode === "signup" ? actions.signUp(values.name.trim(), email, values.password) : actions.logIn(email, values.password),
    );
  };

  const resetPassword = () => {
    const email = values.email.trim();
    if (!isValidEmail(email)) {
      setErrors({ email: "Enter your email above, then choose “Forgot password?”." });
      return;
    }
    void run("reset", async () => {
      await actions.resetPassword(email);
      return `If an account exists for ${email}, a password reset link is on its way.`;
    });
  };

  return (
    <>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-end text-primary-foreground shadow-lg shadow-primary/30">
        <ScanFace className="h-7 w-7" />
      </span>
      <h2 id="auth-title" className="mt-5 text-center text-xl font-bold tracking-tight">
        {copy.title}
      </h2>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="mt-6 flex gap-1 rounded-full border bg-muted/70 p-1" role="tablist">
        {(Object.keys(COPY) as AuthMode[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            onClick={() => switchMode(tab)}
            className={cn(
              "flex-1 rounded-full py-1.5 text-sm font-medium transition-all",
              mode === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {COPY[tab].tab}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="mt-5 space-y-3">
        {mode === "signup" && <TextField id="auth-name" label="Username" icon={User} autoComplete="username" {...field("name")} />}
        <TextField id="auth-email" label="Email" icon={Mail} type="email" autoComplete="email" {...field("email")} />
        <TextField
          id="auth-password"
          label="Password"
          icon={Lock}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          {...field("password")}
        />
        {mode === "signup" && (
          <TextField id="auth-confirm" label="Re-enter password" icon={Lock} type="password" autoComplete="new-password" {...field("confirm")} />
        )}

        {mode === "login" && (
          <div className="flex justify-end">
            <button type="button" onClick={resetPassword} disabled={busy !== null} className="text-xs font-medium text-accent hover:underline">
              {busy === "reset" ? "Sending reset link..." : "Forgot password?"}
            </button>
          </div>
        )}

        <FormError message={error} />

        <Button type="submit" disabled={busy !== null} className="w-full">
          {busy === "form" && <Loader2 className="animate-spin" />}
          {copy.submit}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        variant="outline"
        onClick={() => void run("google", actions.google, { releaseOnReturn: true })}
        disabled={busy !== null}
        className="w-full"
      >
        {busy === "google" ? <Loader2 className="animate-spin" /> : <GoogleLogo />}
        {copy.google}
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <button type="button" onClick={() => switchMode(mode === "signup" ? "login" : "signup")} className="font-semibold text-accent hover:underline">
          {mode === "signup" ? "Log in" : "Create an account"}
        </button>
      </p>
    </>
  );
};

/** Login / sign-up modal: email and password, or Google. */
const AuthDialog = ({ mode, onModeChange, onClose, actions }: AuthDialogProps) => (
  <Modal open={mode !== null} onClose={onClose} labelledBy="auth-title">
    {mode && <AuthPanel mode={mode} onModeChange={onModeChange} actions={actions} />}
  </Modal>
);

export default AuthDialog;
