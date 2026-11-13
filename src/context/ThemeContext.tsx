import React, { createContext, useEffect, useContext } from "react";
import { localStore } from "../utils/safeStorage";

// The app ships in light mode only. Most screens have no dark styling, so a
// "dark" class left on <html> produced black screens, a black tab bar and white
// text on white cards. The context keeps its shape for existing callers, but
// darkMode is always false and toggling does nothing.
const ThemeContext = createContext<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}>({
  darkMode: false,
  toggleDarkMode: () => {},
});

const noop = () => {};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Undo a dark theme saved by older builds (the /test page had a toggle).
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    if (localStore.getItem("theme") === "dark") {
      localStore.removeItem("theme");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: noop }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
