import { FirebaseError } from "firebase/app";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists. Log in instead.",
  "auth/weak-password": "That password is too weak. Choose a longer one.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/requires-recent-login": "For security, please log out, log in again and retry.",
  "auth/user-mismatch": "Please choose the Google account you are signed in with.",
  "auth/provider-already-linked": "This account already has a password.",
  "auth/credential-already-in-use": "This email and password are already used by another account.",
  "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/unauthorized-domain": "This website's domain is not authorised for sign-in in Firebase (Authentication → Settings → Authorized domains).",
};
const CANCELLED = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

/** User-facing message for a failed Firebase auth call, or null when the user simply cancelled. */
export const authErrorMessage = (error: unknown, overrides: Record<string, string> = {}) => {
  const code = error instanceof FirebaseError ? error.code : "";
  if (CANCELLED.has(code)) return null;
  return overrides[code] ?? MESSAGES[code] ?? "Something went wrong. Please try again.";
};
