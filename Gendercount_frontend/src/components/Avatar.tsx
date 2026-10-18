import { useState } from "react";
import type { User } from "firebase/auth";
import { userName } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/** The user's photo, or their initial on the brand gradient when there is no photo (or it fails to load). */
const Avatar = ({ user, className }: { user: User; className?: string }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const name = userName(user);

  return user.photoURL && !photoFailed ? (
    <img
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setPhotoFailed(true)}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-end font-semibold text-primary-foreground",
        className,
      )}
    >
      {name[0].toUpperCase()}
    </span>
  );
};

export default Avatar;
