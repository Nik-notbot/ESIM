import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import BlogPost from "../components/BlogPost";
import Footer from "../components/Footer";
import { ArrowLeft, Link as LinkIcon, Twitter, Rss, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import siteConfig from "../config/siteConfig";
import { usePostBySlug, useAllPosts } from "../hooks/useStaticPosts";

interface PostProps {
  slug?: string;
  isHomepage?: boolean;
  homepageType?: "page" | "post";
}

export default function Post({
  slug: propSlug,
  isHomepage = false,
}: PostProps = {}) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = propSlug || routeSlug;

  const post = usePostBySlug(slug);
  const allPosts = useAllPosts();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!location.hash || post === undefined) return;
    const timer = setTimeout(() => {
      const id = location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.hash, post]);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Блог HEY, STORE!`;
    return () => { document.title = "Блог HEY, STORE!"; };
  }, [post]);

  if (post === undefined) return null;

  if (post === null) {
    return (
      <div className="post-page">
        <div className="post-not-found">
          <h1>Страница не найдена</h1>
          <p>Статья не существует или была удалена.</p>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(post.title);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const relatedPosts = allPosts
    ?.filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3) ?? [];

  return (
    <div className="post-page">
      <nav className="post-nav">
        {!isHomepage && (
          <button onClick={() => navigate("/")} className="back-button">
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
        )}
      </nav>

      <article className="post-article">
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta-header">
            {post.date && (
              <time className="post-date">
                {new Date(post.date).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                })}
              </time>
            )}
            {post.readTime && (
              <>
                <span className="post-meta-separator">·</span>
                <span className="post-read-time">{post.readTime}</span>
              </>
            )}
          </div>
          {post.description && (
            <p className="post-description">{post.description}</p>
          )}
        </header>

        <BlogPost content={post.content} />

        <footer className="post-footer">
          <div className="post-share">
            <button onClick={handleCopyLink} className="share-button" aria-label="Copy link">
              <LinkIcon size={16} />
              <span>{copied ? "Скопировано!" : "Ссылка"}</span>
            </button>
            <button onClick={handleShareTwitter} className="share-button" aria-label="Share on Twitter">
              <Twitter size={16} />
              <span>Tweet</span>
            </button>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              <Tag size={14} className="post-tags-icon" aria-hidden="true" />
              {post.tags.map((tag) => (
                <span key={tag} className="post-tag">{tag}</span>
              ))}
            </div>
          )}

          {relatedPosts.length > 0 && (
            <div className="related-posts">
              <h3 className="related-posts-title">Похожие статьи</h3>
              <ul className="related-posts-list">
                {relatedPosts.map((rp) => (
                  <li key={rp.slug} className="related-post-item">
                    <Link to={`/${rp.slug}`} className="related-post-link">
                      <span className="related-post-title">{rp.title}</span>
                      {rp.readTime && (
                        <span className="related-post-meta">{rp.readTime}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </footer>

        {siteConfig.footer.enabled && siteConfig.footer.showOnPosts && (
          <Footer />
        )}
      </article>
    </div>
  );
}
