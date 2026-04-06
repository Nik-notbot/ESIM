import { useState, useEffect } from "react";

export interface StaticPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readTime: string;
  content: string;
  _id?: string;
  layout?: string;
  image?: string;
  showImageAtTop?: boolean;
  authorName?: string;
  authorImage?: string;
  rightSidebar?: boolean;
  aiChat?: boolean;
  showFooter?: boolean;
  footer?: string;
}

let cachedPosts: StaticPost[] | null = null;

async function loadPosts(): Promise<StaticPost[]> {
  if (cachedPosts) return cachedPosts;
  const base = import.meta.env.BASE_URL || "/";
  const res = await fetch(`${base}posts-data.json`);
  const data = await res.json();
  cachedPosts = data.map((p: StaticPost) => ({ ...p, _id: p.slug }));
  return cachedPosts!;
}

export function useAllPosts(): StaticPost[] | undefined {
  const [posts, setPosts] = useState<StaticPost[] | undefined>(
    cachedPosts ?? undefined
  );
  useEffect(() => {
    loadPosts().then(setPosts);
  }, []);
  return posts;
}

export function usePostBySlug(slug?: string): StaticPost | null | undefined {
  const posts = useAllPosts();
  if (!slug) return null;
  if (posts === undefined) return undefined;
  return posts.find((p) => p.slug === slug) ?? null;
}
