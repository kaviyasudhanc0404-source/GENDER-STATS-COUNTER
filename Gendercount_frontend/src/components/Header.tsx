import { Moon, ScanFace, Sun } from "lucide-react";
import Button from "@/components/Button";
import ModeTabs from "@/components/ModeTabs";
import ProfileMenu from "@/components/ProfileMenu";
import { useAuth } from "@/hooks/use-auth";
import type { Theme } from "@/hooks/use-theme";
import type { InputMode } from "@/lib/constants";

interface HeaderProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

const Header = ({ mode, onModeChange, theme, onToggleTheme, onSignOut }: HeaderProps) => {
  const { user, openAuth } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur-xl">
      <div className="container flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-end text-primary-foreground shadow-md shadow-primary/30">
            <ScanFace className="h-5 w-5" />
          </span>
          <span className="hidden font-semibold tracking-tight min-[400px]:inline">Gender Statistics Counter</span>
        </div>

        <ModeTabs activeMode={mode} onModeChange={onModeChange} className="order-last w-full sm:order-none sm:ml-auto sm:w-auto" />

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {user === null && (
            <>
              <Button variant="outline" onClick={() => openAuth("login")} className="h-9 px-4">
                Log in
              </Button>
              <Button onClick={() => openAuth("signup")} className="hidden h-9 px-4 sm:inline-flex">
                Sign up
              </Button>
            </>
          )}
          {user && <ProfileMenu onSignOut={onSignOut} />}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-card/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
