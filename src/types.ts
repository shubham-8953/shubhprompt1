export interface Prompt {
  id: string;
  title: string;
  description: string;
  fullPrompt: string;
  category: string;
  platform: string;
  tags: string[];
  coverImage: string;
  previewImages: string[];
  animation?: string;
  videoDemo?: string;
  createdAt: string;
  views: number;
  likes: number;
  shares: number;
  copyCount: number;
  published: boolean;
  featured?: boolean;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  content: string;
  featuredImage: string;
  video?: string;
  tags: string[];
  relatedPrompts: string[]; // prompt IDs of related prompts
  createdAt: string;
  views: number;
}

export interface WatchPrompt {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // YouTube / YouTube Shorts URL
  thumbnailUrl: string; // Auto-generated YT thumbnail
  platform: string; // e.g., Midjourney, Sora
  published: boolean;
  createdAt: string;
  views: number;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  type: 'featured' | 'trending' | 'latest' | 'category';
  value?: string; // category name or empty
  enabled: boolean;
  order: number;
}

export interface AppSettings {
  logoName: string;
  primaryColor: string;
  secondaryColor: string;
  seoTitle: string;
  seoDescription: string;
  socialTwitter: string;
  socialGithub: string;
  socialYoutube: string;
  socialInstagram?: string;
  socialFacebook?: string;
  contactEmail?: string;
  adminEmail?: string;
  homepageSections: HomepageSection[];
  isConfiguredWithSupabase: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  totalViews: number;
  totalCopies: number;
  mostViewedPrompts: { promptId: string; title: string; views: number }[];
  mostCopiedPrompts: { promptId: string; title: string; copies: number }[];
  topCategories: { category: string; count: number }[];
  topPlatforms: { platform: string; count: number }[];
}

export const SUPPORTED_PLATFORMS = [
  "ChatGPT",
  "Gemini",
  "Claude",
  "Grok",
  "Perplexity",
  "DeepSeek",
  "Midjourney",
  "Flux",
  "Ideogram",
  "Leonardo AI",
  "Recraft",
  "Veo",
  "Sora",
  "Runway",
  "Kling",
  "Pika"
] as const;

export const DEFAULT_CATEGORIES = [
  "Text Generation",
  "Image Generation",
  "Video Generation",
  "Software Engineering",
  "Marketing & Copywriting",
  "Web Search & Research",
  "Audio & Music Workflows",
  "Data Analysis"
];
