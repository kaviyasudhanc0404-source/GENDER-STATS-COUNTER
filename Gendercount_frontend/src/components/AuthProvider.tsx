import { useEffect, useReducer, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { toast } from "sonner";
import AuthDialog, { type AuthActions } from "@/components/AuthDialog";
import { AuthContext, hasPassword, type AuthMode } from "@/hooks/use-auth";
import { auth, googleProvider } from "@/lib/firebase";

/** Tracks the Firebase user and shows the login / sign-up dialog when a signed-out user tries to use the app. */
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<AuthMode | null>(null);
  const [, refreshProfile] = useReducer((version: number) => version + 1, 0); // re-render after the display name is set

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const welcome = (signedIn: User) => {
    setDialogMode(null);
    toast.success(`Welcome, ${signedIn.displayName ?? signedIn.email ?? "there"}!`);
  };

  // Each action throws Firebase errors, which the dialog shows next to the form
  const actions: AuthActions = {
    google: async () => welcome((await signInWithPopup(auth, googleProvider)).user),
    logIn: async (email, password) => welcome((await signInWithEmailAndPassword(auth, email, password)).user),
    signUp: async (name, email, password) => {
      const { user: created } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(created, { displayName: name });
      refreshProfile();
      welcome(created);
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
  };

  /** The signed-in user for profile actions (they are only offered while signed in). */
  const currentUser = () => {
    if (!auth.currentUser) throw new Error("Not signed in");
    return auth.currentUser;
  };

  const value = {
    user,
    requireAuth: (action: () => void) => {
      if (user) action();
      else if (user === null) setDialogMode("login"); // while the session is still loading, ignore the click
    },
    openAuth: setDialogMode,
    signOut: () => firebaseSignOut(auth),
    updateName: async (name: string) => {
      await updateProfile(currentUser(), { displayName: name });
      refreshProfile();
    },
    verifyPassword: async (currentPassword: string) => {
      const account = currentUser();
      await reauthenticateWithCredential(account, EmailAuthProvider.credential(account.email ?? "", currentPassword));
    },
    verifyWithGoogle: async () => {
      await reauthenticateWithPopup(currentUser(), googleProvider);
    },
    setPassword: async (newPassword: string) => {
      const account = currentUser();
      if (hasPassword(account)) {
        await updatePassword(account, newPassword);
        return;
      }
      await linkWithCredential(account, EmailAuthProvider.credential(account.email ?? "", newPassword));
      refreshProfile(); // the account now also has the email & password sign-in method
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDialog mode={dialogMode} onModeChange={setDialogMode} onClose={() => setDialogMode(null)} actions={actions} />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
