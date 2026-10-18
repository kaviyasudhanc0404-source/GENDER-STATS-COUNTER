import { useState, type FormEvent } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { CheckCircle2, Loader2, Lock, Mail, User, UserPen } from "lucide-react";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import FormError from "@/components/FormError";
import Modal from "@/components/Modal";
import GoogleLogo from "@/components/GoogleLogo";
import TextField from "@/components/TextField";
import { hasPassword, useAuth, userName } from "@/hooks/use-auth";
import { useAuthAction } from "@/hooks/use-auth-action";
import { useFormFields } from "@/hooks/use-form-fields";
import { compact, nameError, newPasswordErrors } from "@/lib/validation";

const EMPTY_PASSWORDS = { current: "", password: "", confirm: "" };

/** Edit form; mounted each time the dialog opens, so it always starts from the saved profile. */
const ProfilePanel = ({ user }: { user: FirebaseUser }) => {
  const { updateName, verifyPassword, verifyWithGoogle, setPassword } = useAuth();
  const nameForm = useFormFields({ name: user.displayName ?? "" });
  const passwordForm = useFormFields(EMPTY_PASSWORDS);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState(false); // step 2: choose the new password
  const profile = useAuthAction<"name">();
  const security = useAuthAction<"verify" | "password">();
  const usesPassword = hasPassword(user);

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    const name = nameForm.values.name.trim();
    if (!nameForm.check(compact({ name: nameError(name) }))) return;
    void profile.run("name", async () => {
      await updateName(name);
      setIsEditingName(false);
      return "Profile updated.";
    });
  };

  const cancelNameEdit = () => {
    nameForm.setValues({ name: user.displayName ?? "" });
    nameForm.setErrors({});
    profile.setError(null);
    setIsEditingName(false);
  };

  const resetPasswordForm = () => {
    passwordForm.setValues(EMPTY_PASSWORDS);
    passwordForm.setErrors({});
    setIsIdentityConfirmed(false);
  };

  /**
   * Step 1: confirm it's really the user (current password, or Google for accounts without a password).
   * Step 2: set the new password; for a Google account this adds email & password as a second way to log in.
   */
  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    const { current, password, confirm } = passwordForm.values;
    if (!isIdentityConfirmed) {
      if (!usesPassword) {
        void security.run(
          "verify",
          async () => {
            await verifyWithGoogle();
            setIsIdentityConfirmed(true);
          },
          { releaseOnReturn: true },
        );
        return;
      }
      if (!passwordForm.check(compact({ current: current ? undefined : "Enter your current password." }))) return;
      void security.run(
        "verify",
        async () => {
          await verifyPassword(current);
          setIsIdentityConfirmed(true);
        },
        { errors: { "auth/invalid-credential": "Your current password is incorrect." } },
      );
      return;
    }
    if (!passwordForm.check(compact(newPasswordErrors(password, confirm)))) return;
    void security.run("password", async () => {
      await setPassword(password);
      resetPasswordForm();
      return usesPassword ? "Password updated." : "Password set. You can now also log in with your email and password.";
    });
  };

  return (
    <>
      <div className="flex items-center gap-4 pr-8">
        <Avatar user={user} className="h-14 w-14 text-xl" />
        <div className="min-w-0">
          <h2 id="profile-title" className="truncate text-lg font-bold tracking-tight">
            Profile
          </h2>
          <p className="truncate text-sm text-muted-foreground">{userName(user)}</p>
        </div>
      </div>

      <form onSubmit={saveName} noValidate className="mt-6 space-y-3">
        <TextField
          key={isEditingName ? "editing" : "viewing"} // remount to focus the field when editing starts
          id="profile-name"
          label="Name"
          icon={User}
          autoComplete="name"
          showLabel
          disabled={!isEditingName}
          autoFocus={isEditingName}
          {...nameForm.field("name")}
        />
        <TextField id="profile-email" label="Email (can't be changed)" icon={Mail} value={user.email ?? ""} disabled showLabel />
        <FormError message={profile.error} />
        {isEditingName ? (
          <div className="flex gap-2">
            <Button key="cancel" variant="outline" onClick={cancelNameEdit} disabled={profile.busy !== null} className="flex-1">
              Cancel
            </Button>
            <Button
              key="save"
              type="submit"
              disabled={profile.busy !== null || nameForm.values.name.trim() === (user.displayName ?? "")}
              className="flex-1"
            >
              {profile.busy === "name" && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        ) : (
          <Button key="edit" onClick={() => setIsEditingName(true)} className="w-full">
            <UserPen />
            Edit profile
          </Button>
        )}
      </form>

      <div className="mt-6 border-t pt-6">
        <h3 className="px-1 text-sm font-semibold">{usesPassword ? "Change password" : "Set password"}</h3>
        <form onSubmit={submitPassword} noValidate className="mt-3 space-y-3">
          {isIdentityConfirmed ? (
            <>
              <p className="flex items-center gap-2 px-1 text-sm text-accent">
                <CheckCircle2 className="h-4 w-4" />
                {usesPassword ? "Current password confirmed. Choose a new one." : "Identity confirmed. Choose a password."}
              </p>
              <TextField
                id="profile-password"
                label={usesPassword ? "New password" : "Password"}
                icon={Lock}
                type="password"
                autoComplete="new-password"
                autoFocus
                {...passwordForm.field("password")}
              />
              <TextField
                id="profile-confirm"
                label={usesPassword ? "Re-enter new password" : "Re-enter password"}
                icon={Lock}
                type="password"
                autoComplete="new-password"
                {...passwordForm.field("confirm")}
              />
            </>
          ) : usesPassword ? (
            <TextField id="profile-current" label="Current password" icon={Lock} type="password" autoComplete="current-password" {...passwordForm.field("current")} />
          ) : (
            <p className="px-1 text-sm text-muted-foreground">
              You sign in with Google. Add a password so you can also log in with your email address.
            </p>
          )}
          <FormError message={security.error} />
          <Button type="submit" variant="outline" disabled={security.busy !== null} className="w-full">
            {security.busy !== null ? <Loader2 className="animate-spin" /> : !isIdentityConfirmed && !usesPassword && <GoogleLogo />}
            {isIdentityConfirmed ? (usesPassword ? "Update password" : "Set password") : usesPassword ? "Continue" : "Confirm with Google"}
          </Button>
          {isIdentityConfirmed && (
            <button type="button" onClick={resetPasswordForm} className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          )}
        </form>
      </div>
    </>
  );
};

/** Modal for editing the signed-in user's name and password. */
const ProfileDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  return (
    <Modal open={open && Boolean(user)} onClose={onClose} labelledBy="profile-title">
      {user && <ProfilePanel user={user} />}
    </Modal>
  );
};

export default ProfileDialog;
