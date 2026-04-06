export default function Footer() {
  return (
    <footer className="blog-footer">
      <div className="blog-footer-links">
        <a href="https://heystore.net" target="_blank" rel="noopener noreferrer">HEY, STORE!</a>
        <a href="https://t.me/hey_store_official" target="_blank" rel="noopener noreferrer">Telegram канал</a>
        <a href="https://t.me/hey_store_bot" target="_blank" rel="noopener noreferrer">Поддержка</a>
      </div>
      <p className="blog-footer-copy">© {new Date().getFullYear()} HEY, eSIM! Часть экосистемы HEY, STORE! Все права защищены.</p>
    </footer>
  );
}
