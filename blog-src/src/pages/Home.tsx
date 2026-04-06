import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import Footer from "../components/Footer";
import { useAllPosts } from "../hooks/useStaticPosts";

export default function Home() {
  const posts = useAllPosts();

  return (
    <div className="home">
      <header className="home-hero">
        <div style={{ textAlign: "center", paddingBottom: 24 }}>
          <a href="https://heyesim.net" rel="noopener noreferrer">
            <img 
              src={`${import.meta.env.BASE_URL}logo-arnold.png`}
              width={180}
              height={180}
              alt="HEY, eSIM!" 
              style={{ objectFit: "contain" }}
            />
          </a>
        </div>

        <h1 className="home-hero-title">Блог HEY, STORE!</h1>
        <p className="home-hero-subtitle">
          Гайды, кейсы и обновления экосистемы Арнольда
        </p>

        <div className="home-telegram-buttons">
          <a 
            href="https://t.me/hey_store_official" 
            target="_blank" 
            rel="noopener noreferrer"
            className="home-tg-btn home-tg-btn-primary"
          >
            <Send size={16} />
            <span>Канал</span>
          </a>
          <a 
            href="https://t.me/heystore_official" 
            target="_blank" 
            rel="noopener noreferrer"
            className="home-tg-btn home-tg-btn-secondary"
          >
            <span>💬</span>
            <span>Поддержка</span>
          </a>
        </div>
      </header>

      <main className="home-content">
        {posts === undefined ? (
          <div className="home-loading">Загрузка...</div>
        ) : posts.length === 0 ? (
          <div className="home-empty">Пока нет статей</div>
        ) : (
          <div className="home-posts">
            {posts.map((post) => (
              <Link 
                key={post.slug} 
                to={`/${post.slug}`} 
                className="home-post-item"
              >
                <div className="home-post-main">
                  <h2 className="home-post-title">{post.title}</h2>
                  {post.description && (
                    <p className="home-post-excerpt">{post.description}</p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="home-post-tags">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="home-post-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="home-post-meta">
                  {post.readTime && (
                    <span className="home-post-readtime">{post.readTime}</span>
                  )}
                  {post.date && (
                    <span className="home-post-date">
                      {new Date(post.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
