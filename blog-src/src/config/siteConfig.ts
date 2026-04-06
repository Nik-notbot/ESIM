import { ReactNode } from "react";
export type { LogoItem, LogoGalleryConfig } from "../components/LogoMarquee";
import type { LogoGalleryConfig } from "../components/LogoMarquee";

// Interfaces
export interface GitHubContributionsConfig {
  enabled: boolean;
  username: string;
  showYearNavigation: boolean;
  linkToProfile: boolean;
  title?: string;
}

export interface VisitorMapConfig {
  enabled: boolean;
  title?: string;
}

export interface InnerPageLogoConfig {
  enabled: boolean;
  size: number;
}

export interface BlogPageConfig {
  enabled: boolean;
  showInNav: boolean;
  title: string;
  description?: string;
  order?: number;
  viewMode: "list" | "cards";
  showViewToggle: boolean;
}

export interface HomePostsReadMoreConfig {
  enabled: boolean;
  text: string;
  link: string;
}

export interface PostsDisplayConfig {
  showOnHome: boolean;
  showOnBlogPage: boolean;
  homePostsLimit?: number;
  homePostsReadMore?: HomePostsReadMoreConfig;
}

export interface HardcodedNavItem {
  slug: string;
  title: string;
  order?: number;
  showInNav?: boolean;
  adminOnly?: boolean;
}

export interface GitHubRepoConfig {
  owner: string;
  repo: string;
  branch: string;
  contentPath: string;
}

export type FontFamily = "serif" | "sans" | "monospace";

export interface RightSidebarConfig {
  enabled: boolean;
  minWidth?: number;
}

export interface FooterConfig {
  enabled: boolean;
  showOnHomepage: boolean;
  showOnPosts: boolean;
  showOnPages: boolean;
  showOnBlogPage: boolean;
  defaultContent?: string;
}

export interface HomepageConfig {
  type: "default" | "page" | "post";
  slug?: string;
  originalHomeRoute?: string;
}

export interface AIChatConfig {
  enabledOnWritePage: boolean;
  enabledOnContent: boolean;
}

export interface SiteConfig {
  name: string;
  title: string;
  logo: string | null;
  intro: ReactNode;
  bio: string;
  fontFamily: FontFamily;
  featuredViewMode: "cards" | "list";
  showViewToggle: boolean;
  logoGallery: LogoGalleryConfig;
  gitHubContributions: GitHubContributionsConfig;
  visitorMap: VisitorMapConfig;
  innerPageLogo: InnerPageLogoConfig;
  blogPage: BlogPageConfig;
  hardcodedNavItems: HardcodedNavItem[];
  postsDisplay: PostsDisplayConfig;
  links: {
    docs: string;
    convex: string;
    netlify: string;
  };
  gitHubRepo: GitHubRepoConfig;
  rightSidebar: RightSidebarConfig;
  footer: FooterConfig;
  homepage: HomepageConfig;
  aiChat: AIChatConfig;
}

// ===========================================
// Блог HEY, STORE! — Конфигурация
// ===========================================
export const siteConfig: SiteConfig = {
  name: "Блог HEY, STORE!",
  title: "Блог HEY, STORE!",
  logo: "/images/logo.svg",
  intro: null,
  bio: "Гайды, кейсы и обновления экосистемы HEY, STORE!",

  fontFamily: "sans",

  featuredViewMode: "list",
  showViewToggle: false,

  logoGallery: {
    enabled: false,
    images: [],
    position: "above-footer",
    speed: 30,
    title: "",
    scrolling: false,
    maxItems: 0,
  },

  gitHubContributions: {
    enabled: false,
    username: "",
    showYearNavigation: false,
    linkToProfile: false,
  },

  visitorMap: {
    enabled: true,
    title: "Посетители",
  },

  innerPageLogo: {
    enabled: true,
    size: 36,
  },

  blogPage: {
    enabled: false,
    showInNav: false,
    title: "Blog",
    viewMode: "list",
    showViewToggle: false,
  },

  hardcodedNavItems: [
    {
      slug: "stats",
      title: "Stats",
      order: 10,
      showInNav: true,
      adminOnly: true,
    },
    {
      slug: "write",
      title: "Write",
      order: 20,
      showInNav: true,
      adminOnly: true,
    },
  ],

  postsDisplay: {
    showOnHome: true,
    showOnBlogPage: false,
    homePostsLimit: undefined,
  },

  links: {
    docs: "/",
    convex: "https://convex.dev",
    netlify: "https://netlify.com",
  },

  gitHubRepo: {
    owner: "YOUR_USERNAME",
    repo: "YOUR_REPO",
    branch: "main",
    contentPath: "content/blog",
  },

  rightSidebar: {
    enabled: false,
  },

  // Футер с ТГ ссылками
  footer: {
    enabled: true,
    showOnHomepage: true,
    showOnPosts: true,
    showOnPages: true,
    showOnBlogPage: true,
    defaultContent: `© ${new Date().getFullYear()} HEY, STORE! · [Канал](https://t.me/hey_store_official) · [Бот](https://t.me/hey_store_bot) · [Поддержка](https://t.me/heystore_official)`,
  },

  homepage: {
    type: "default",
    slug: undefined,
    originalHomeRoute: "/home",
  },

  aiChat: {
    enabledOnWritePage: true,
    enabledOnContent: false,
  },
};

export default siteConfig;
