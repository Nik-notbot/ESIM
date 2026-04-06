import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, X, Article, ArrowRight } from "@phosphor-icons/react";
import { useAllPosts } from "../hooks/useStaticPosts";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const posts = useAllPosts();

  const results = useMemo(() => {
    if (!searchQuery.trim() || !posts) return [];
    const q = searchQuery.toLowerCase();
    return posts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
      .map((p) => ({
        _id: p.slug,
        slug: p.slug,
        title: p.title,
        snippet: p.description,
        type: "post" as const,
      }));
  }, [searchQuery, posts]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigate(`/${results[selectedIndex].slug}`);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, navigate, onClose]
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={handleBackdropClick}>
      <div className="search-modal">
        <div className="search-modal-input-wrapper">
          <MagnifyingGlass size={20} className="search-modal-icon" weight="bold" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск по статьям..."
            className="search-modal-input"
            autoComplete="off"
          />
          <button onClick={onClose} className="search-modal-close" aria-label="Close search">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="search-modal-results">
          {searchQuery.trim() === "" ? (
            <div className="search-modal-hint">
              <p>Введите запрос для поиска</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-modal-empty">
              Ничего не найдено по запросу «{searchQuery}»
            </div>
          ) : (
            <ul className="search-results-list">
              {results.map((result, index) => (
                <li key={result._id}>
                  <button
                    className={`search-result-item ${index === selectedIndex ? "selected" : ""}`}
                    onClick={() => { navigate(`/${result.slug}`); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="search-result-icon">
                      <Article size={20} weight="regular" />
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">{result.title}</div>
                      <div className="search-result-snippet">{result.snippet}</div>
                    </div>
                    <ArrowRight size={16} className="search-result-arrow" weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
