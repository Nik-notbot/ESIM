import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import SearchModal from "./SearchModal";
import ScrollToTop, { ScrollToTopConfig } from "./ScrollToTop";

const scrollToTopConfig: Partial<ScrollToTopConfig> = {
  enabled: true,
  threshold: 300,
  smooth: true,
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isSearchOpen) setIsSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  return (
    <div className="layout">
      <header className="blog-header">
        <div className="blog-header-left">
          <Link to="/" className="blog-header-logo">
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt="HEY, eSIM!"
              width={36}
              height={36}
            />
            <span className="blog-header-title">Блог</span>
          </Link>
        </div>

        <nav className="blog-header-nav">
          <a href="https://heyesim.net" className="blog-nav-btn">
            <ArrowLeft size={16} />
            <span>На сайт</span>
          </a>
          <button onClick={openSearch} className="blog-nav-btn" aria-label="Поиск">
            <Search size={16} />
            <span>Поиск</span>
          </button>
          <button onClick={toggleTheme} className="blog-nav-btn" aria-label="Сменить тему">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Светлая" : "Тёмная"}</span>
          </button>
        </nav>
      </header>

      <main className="main-content">
        {children}
      </main>

      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <ScrollToTop config={scrollToTopConfig} />
    </div>
  );
}
