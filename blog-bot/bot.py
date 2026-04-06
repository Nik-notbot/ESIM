"""
Telegram-бот для конвертации статей в Markdown.
Кидаешь ссылку — получаешь готовый .md файл для блога.
"""

import os
import re
import io
import json
import logging
from datetime import datetime
from urllib.parse import urlparse

import requests
import html2text
from bs4 import BeautifulSoup
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

BOT_TOKEN = os.environ.get("BLOG_BOT_TOKEN", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text[:80].strip('-')


def fetch_telegraph(url: str) -> dict:
    """Парсинг статьи с telegra.ph через API."""
    path = urlparse(url).path.strip('/')
    api_url = f"https://api.telegra.ph/getPage/{path}?return_content=true"
    resp = requests.get(api_url, timeout=15)
    data = resp.json()
    if not data.get("ok"):
        raise ValueError("Не удалось загрузить статью с Telegraph")

    result = data["result"]
    title = result.get("title", "Без заголовка")
    author = result.get("author_name", "")
    description = result.get("description", "")

    def nodes_to_html(nodes) -> str:
        parts = []
        for node in nodes:
            if isinstance(node, str):
                parts.append(node)
            elif isinstance(node, dict):
                tag = node.get("tag", "")
                attrs = node.get("attrs", {})
                children = node.get("children", [])
                inner = nodes_to_html(children)
                attr_str = " ".join(f'{k}="{v}"' for k, v in attrs.items())
                if attr_str:
                    parts.append(f"<{tag} {attr_str}>{inner}</{tag}>")
                else:
                    parts.append(f"<{tag}>{inner}</{tag}>")
        return "".join(parts)

    content_html = nodes_to_html(result.get("content", []))
    return {"title": title, "author": author, "description": description, "html": content_html}


def fetch_teletype(url: str) -> dict:
    """Парсинг статьи с teletype.in."""
    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    title_el = soup.find("h1") or soup.find("meta", property="og:title")
    title = ""
    if title_el:
        title = title_el.get_text(strip=True) if title_el.name == "h1" else title_el.get("content", "")

    desc_el = soup.find("meta", property="og:description")
    description = desc_el.get("content", "") if desc_el else ""

    article = soup.find("article") or soup.find("div", class_="content") or soup.find("main")
    html = str(article) if article else ""

    return {"title": title or "Без заголовка", "author": "", "description": description, "html": html}


def fetch_generic(url: str) -> dict:
    """Парсинг любой веб-страницы."""
    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    title_el = soup.find("meta", property="og:title") or soup.find("title")
    if title_el:
        title = title_el.get("content") if title_el.name == "meta" else title_el.get_text(strip=True)
    else:
        title = "Без заголовка"

    desc_el = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
    description = desc_el.get("content", "") if desc_el else ""

    article = (
        soup.find("article")
        or soup.find("div", class_="post-content")
        or soup.find("div", class_="entry-content")
        or soup.find("div", class_="content")
        or soup.find("main")
    )
    html = str(article) if article else ""

    return {"title": title, "author": "", "description": description, "html": html}


def html_to_markdown(html: str) -> str:
    converter = html2text.HTML2Text()
    converter.body_width = 0
    converter.ignore_links = False
    converter.ignore_images = False
    converter.ignore_emphasis = False
    converter.protect_links = True
    converter.unicode_snob = True
    md = converter.handle(html)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip()


def make_md_file(title: str, description: str, content: str, tags: list[str] | None = None) -> str:
    slug = slugify(title)
    date = datetime.now().strftime("%Y-%m-%d")
    word_count = len(content.split())
    read_time = max(1, round(word_count / 200))
    tags_list = tags or []

    frontmatter = f'''---
title: "{title}"
description: "{description}"
date: "{date}"
slug: "{slug}"
published: true
tags: {json.dumps(tags_list, ensure_ascii=False)}
readTime: "{read_time} мин"
---'''

    return f"{frontmatter}\n\n{content}\n"


def fetch_article(url: str) -> dict:
    host = urlparse(url).hostname or ""
    if "telegra.ph" in host:
        return fetch_telegraph(url)
    elif "teletype.in" in host:
        return fetch_teletype(url)
    else:
        return fetch_generic(url)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Привет! Кинь мне ссылку на статью (telegra.ph, teletype.in или любой сайт) — "
        "я верну готовый .md файл для блога."
    )


async def handle_url(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()

    url_match = re.search(r'https?://\S+', text)
    if not url_match:
        await update.message.reply_text("Отправь ссылку на статью.")
        return

    url = url_match.group(0)
    await update.message.reply_text("⏳ Загружаю статью...")

    try:
        article = fetch_article(url)
        md_content = html_to_markdown(article["html"])
        md_file = make_md_file(
            title=article["title"],
            description=article["description"],
            content=md_content,
        )

        slug = slugify(article["title"])
        filename = f"{slug}.md"

        file_bytes = md_file.encode("utf-8")
        doc = io.BytesIO(file_bytes)
        doc.name = filename

        await update.message.reply_document(
            document=doc,
            filename=filename,
            caption=f"📄 {article['title']}\n\nПоложи файл в blog-src/content/blog/ и запусти ./deploy-blog.sh"
        )

    except Exception as e:
        logger.error(f"Error: {e}")
        await update.message.reply_text(f"Ошибка: {e}")


def main():
    if not BOT_TOKEN:
        print("Укажи токен бота в переменной BLOG_BOT_TOKEN")
        print("Пример: BLOG_BOT_TOKEN=123456:ABC-DEF python bot.py")
        return

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_url))

    print("🤖 Бот запущен!")
    app.run_polling()


if __name__ == "__main__":
    main()
