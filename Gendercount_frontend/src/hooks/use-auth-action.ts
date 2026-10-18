import { useState } from "react";
import { toast } from "sonner";
import { authErrorMessage } from "@/lib/auth-errors";

interface RunOptions {
  /** Popup sign-in: re-enable the form when the user comes back to the page (the browser hides when the popup closes). */
  releaseOnReturn?: boolean;
  /** Context-specific messages for Firebase error codes. */
  errors?: Record<string, string>;
}

/** Busy state for forms that call Firebase auth: errors show in the form, successes as a notification. */
export const useAuthAction = <Kind extends string>() => {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Runs `task`; a returned string is shown as a success notification, a thrown Firebase error in the form. */
  const run = async (kind: Kind, task: () => Promise<string | void>, { releaseOnReturn = false, errors }: RunOptions = {}) => {
    setBusy(kind);
    setError(null);
    const release = () => {
      if (document.visibilityState === "visible") setBusy(null);
    };
    if (releaseOnReturn) {
      window.addEventListener("focus", release);
      document.addEventListener("visibilitychange", release);
    }
    try {
      const success = await task();
      if (success) toast.success(success);
    } catch (caught) {
      setError(authErrorMessage(caught, errors));
    } finally {
      window.removeEventListener("focus", release);
      document.removeEventListener("visibilitychange", release);
      setBusy(null);
    }
  };

  return { busy, error, setError, run };
};
