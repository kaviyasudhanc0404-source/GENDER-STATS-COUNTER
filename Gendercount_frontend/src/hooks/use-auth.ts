import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export type AuthMode = "login" | "signup";

interface AuthContextValue {
  /** Signed-in user; `null` when signed out, `undefined` while Firebase restores the session. */
  user: User | null | undefined;
  /** Runs `action` when signed in; otherwise asks the user to log in first. */
  requireAuth: (action: () => void) => void;
  openAuth: (mode: AuthMode) => void;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  /** Confirm the user's identity (Firebase requires a recent login before a password can be set or changed). */
  verifyPassword: (currentPassword: string) => Promise<void>;
  verifyWithGoogle: () => Promise<void>;
  /** Changes the password, or adds one to a Google-only account so it can also log in with email and password. */
  setPassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
};

/** Display name, falling back to the email address. */
export const userName = (user: User) => user.displayName || user.email || "Account";

/** Whether the account signs in with email and password (rather than only Google). */
export const hasPassword = (user: User) => user.providerData.some((provider) => provider.providerId === "password");
