import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme"; // also read by the inline script in index.html
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const savedTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

/** Light/dark theme: follows the device setting until the user picks one, then remembers the choice. */
export const useTheme = () => {
  // index.html has already applied the saved or device theme before React started
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const query = darkQuery();
    const followDevice = () => {
      if (!savedTheme()) setTheme(query.matches ? "dark" : "light");
    };
    query.addEventListener("change", followDevice);
    return () => query.removeEventListener("change", followDevice);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (e.g. private mode): the switch still works for this visit
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
};
