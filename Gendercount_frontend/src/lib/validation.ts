/** Form validation shared by the login, sign-up and profile forms. */

const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim());

export const nameError = (name: string) => (name.trim().length < 2 ? "Enter a name (at least 2 characters)." : undefined);

export const newPasswordErrors = (password: string, confirm: string) => ({
  password: password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined,
  confirm: confirm !== password ? "Passwords don't match." : undefined,
});

/** Drops fields without an error, so `Object.keys(errors).length` tells whether the form is valid. */
export const compact = <T extends Record<string, string | undefined>>(errors: T) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as Partial<T>;
