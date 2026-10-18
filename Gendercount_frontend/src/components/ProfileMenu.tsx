import { useEffect, useRef, useState } from "react";
import { LogOut, UserPen } from "lucide-react";
import Avatar from "@/components/Avatar";
import ProfileDialog from "@/components/ProfileDialog";
import { useAuth, userName } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const MENU_ITEM = "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none";

/** Avatar button that opens the account menu: details, Edit profile and Sign out. */
const ProfileMenu = ({ onSignOut }: { onSignOut: () => void }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the menu or on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const name = userName(user);

  const choose = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${name}`}
        title={name}
        className="flex rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar user={user} className="h-9 w-9 border text-sm" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-3xl border bg-card p-2 shadow-2xl"
        >
          <div className="flex items-center gap-3 p-3">
            <Avatar user={user} className="h-12 w-12 text-lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>

          <div className="mt-1 space-y-0.5 border-t pt-2">
            <button type="button" role="menuitem" onClick={choose(() => setIsEditing(true))} className={cn(MENU_ITEM, "hover:bg-muted focus-visible:bg-muted")}>
              <UserPen className="h-4 w-4 text-muted-foreground" />
              Edit profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={choose(onSignOut)}
              className={cn(MENU_ITEM, "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10")}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <ProfileDialog open={isEditing} onClose={() => setIsEditing(false)} />
    </div>
  );
};

export default ProfileMenu;
