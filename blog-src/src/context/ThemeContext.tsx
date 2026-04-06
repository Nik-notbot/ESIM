import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

const DEFAULT_THEME: Theme = "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return DEFAULT_THEME;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
