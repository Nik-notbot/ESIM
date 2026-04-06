import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../content/blog");
const OUT_FILE = path.resolve(__dirname, "../public/posts-data.json");

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

const posts = files
  .map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    if (data.published === false) return null;
    return {
      slug: data.slug || file.replace(/\.md$/, ""),
      title: data.title || "Без заголовка",
      description: data.description || "",
      date: data.date || "",
      tags: data.tags || [],
      readTime: data.readTime || "",
      content,
    };
  })
  .filter(Boolean)
  .sort((a: any, b: any) => (b.date > a.date ? 1 : -1));

fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2), "utf-8");
console.log(`Generated ${posts.length} posts → ${OUT_FILE}`);
