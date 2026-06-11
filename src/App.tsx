import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAO2iZB-WLyQDUPGm_eanBXCrncupD-GvQ",
  authDomain: "://firebaseapp.com",
  projectId: "shubhprompt-new",
  storageBucket: "shubhprompt-new.firebasestorage.app",
  messagingSenderId: "1098185002879",
  appId: "1:1098185002879:web:fbd7d5544aec9f60aa944a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PromptCard from "./components/PromptCard";
import PromptDetailsModal from "./components/PromptDetailsModal";
import PromptCompareModal from "./components/PromptCompareModal";
import GuideSection from "./components/GuideSection";
import AdminPanel from "./components/AdminPanel";
import ToastNotification, { ToastItem } from "./components/ToastNotification";
import CompliancePages from "./components/CompliancePages";
import AdSensePlaceholder from "./components/AdSensePlaceholder";
import { Prompt, Guide, WatchPrompt, AppSettings, AnalyticsSummary, SUPPORTED_PLATFORMS, DEFAULT_CATEGORIES } from "./types";
import { PromptCardSkeleton, GuideCardSkeleton, WatchPromptSkeleton } from "./components/SkeletonLoader";
import { Sparkles, Copy, Star, SlidersHorizontal, ArrowUpDown, HelpCircle, X, Check, Heart, Mail, Github, Twitter, Info, Lock, FolderOpen, Film, Play, Video, Instagram, Youtube, Facebook, Eye, Share2, Trash2, ExternalLink, Columns } from "lucide-react";

export default function App() {
  const [promptsList, setPromptsList] = useState<any[]>([]);
  const [isPromptsListLoading, setIsPromptsListLoading] = useState<boolean>(true);
  const [copiedFirebaseId, setCopiedFirebaseId] = useState<string | null>(null);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [watchPrompts, setWatchPrompts] = useState<WatchPrompt[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Router / Application Tabs: 'home' | 'prompts' | 'guides' | 'categories' | 'trending' | 'admin'
  const [activeTab, setActiveTab] = useState<string>("home");

  // Advanced search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All Platforms");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [sortBy, setSortBy] = useState<"latest" | "views" | "copies" | "likes" | "trending">("latest");

  // Modal active variables
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedPrompts, setLikedPrompts] = useState<string[]>([]);
  const [copiedPrompts, setCopiedPrompts] = useState<string[]>([]);
  const [sharedPrompts, setSharedPrompts] = useState<string[]>([]);
  const [viewedPrompts, setViewedPrompts] = useState<string[]>([]);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("isAdmin") === "true" ? "admin_token_bypass" : null;
  });

  // Dual Prompt Comparison states & handlers
  const [compareList, setCompareList] = useState<Prompt[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  const handleToggleCompare = (p: Prompt) => {
    setCompareList(prev => {
      const exists = prev.some(item => item.id === p.id);
      if (exists) {
        return prev.filter(item => item.id !== p.id);
      } else {
        if (prev.length >= 2) {
          triggerToast("info", "You can compare up to 2 prompts at the same time.", "Comparison Limit");
          return prev;
        }
        const updated = [...prev, p];
        if (updated.length === 2) {
          setShowCompareModal(true);
        }
        return updated;
      }
    });
  };

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const triggerToast = (type: "copy" | "share" | "success" | "info", message: string, title?: string, platform?: string) => {
    const newToast: ToastItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      title,
      platform,
      duration: 3000
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Admin login popup
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Email support states
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // Read backend database values
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/data");
      const db = await res.json();
      setPrompts(db.prompts || []);
      setGuides(db.guides || []);
      setWatchPrompts(db.watch_prompts || []);
      setSettings(db.settings || null);
      
      // Calculate real-time analytics summaries dynamically from prompts to render in admin
      const totalViews = db.prompts.reduce((sum: number, p: Prompt) => sum + (p.views || 0), 0);
      const totalCopies = db.prompts.reduce((sum: number, p: Prompt) => sum + (p.copyCount || 0), 0);
      
      const mostViewedPrompts = [...db.prompts]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
        .map((p: Prompt) => ({ promptId: p.id, title: p.title, views: p.views }));

      const mostCopiedPrompts = [...db.prompts]
        .sort((a, b) => b.copyCount - a.copyCount)
        .slice(0, 5)
        .map((p: Prompt) => ({ promptId: p.id, title: p.title, copies: p.copyCount }));

      // Categories aggregations
      const catCount: Record<string, number> = {};
      db.prompts.forEach((p: Prompt) => {
        catCount[p.category] = (catCount[p.category] || 0) + 1;
      });
      const topCategories = Object.entries(catCount).map(([category, count]) => ({ category, count }));

      // Platforms aggregations
      const platCount: Record<string, number> = {};
      db.prompts.forEach((p: Prompt) => {
        platCount[p.platform] = (platCount[p.platform] || 0) + 1;
      });
      const topPlatforms = Object.entries(platCount).map(([platform, count]) => ({ platform, count }));

      setAnalytics({
        totalVisitors: db.analytics?.totalVisitors || 0,
        totalViews,
        totalCopies,
        mostViewedPrompts,
        mostCopiedPrompts,
        topCategories,
        topPlatforms
      });
    } catch (err) {
      console.error("Failed to load initial application resources.", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchFirebasePrompts() {
      setIsPromptsListLoading(true);
      try {
        const q = query(collection(db, "prompts"), orderBy("created_at", "desc"));
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const taglineFallback = data.tagline || (data.raw_prompt ? (data.raw_prompt.substring(0, 110) + "...") : "Industrial-grade prompt asset.");
          const imageUrlFallback = data.image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600";
          list.push({
            id: doc.id,
            title: data.title || "Untitled Prompt",
            tagline: taglineFallback,
            raw_prompt: data.raw_prompt || "",
            engine_category: data.engine_category || "General",
            classification: data.classification || "AI Prompt",
            search_tags: data.search_tags || ["AI", "Creative"],
            image_url: imageUrlFallback,
            video_link: data.video_link || "https://youtube.com",
            total_views: data.total_views || 0,
            total_likes: data.total_likes || 0,
            total_shares: data.total_shares || 0,
            
            // Map standard Prompt fields to ensure downstream components operate perfectly
            description: taglineFallback,
            fullPrompt: data.raw_prompt || "",
            category: data.classification || "AI Prompt",
            platform: data.engine_category || "General",
            tags: data.search_tags || ["AI", "Creative"],
            coverImage: imageUrlFallback,
            videoDemo: data.video_link || "https://youtube.com",
            views: data.total_views || 0,
            likes: data.total_likes || 0,
            shares: data.total_shares || 0,
            copyCount: data.total_copies || 0,
            published: data.is_published !== false,
            featured: data.is_featured === true,
            createdAt: data.created_at || new Date().toISOString()
          });
        });
        setPromptsList(list);
      } catch (err) {
        console.error("Error loading prompt catalog from Google Firebase:", err);
      } finally {
        setIsPromptsListLoading(false);
      }
    }
    fetchFirebasePrompts();
  }, []);

  useEffect(() => {
    fetchAllData();

    // Log individual visit hit
    trackEvent("visitor");

    // Listen to hash routes to enable secret direct /admin loading if required
    const handleHash = () => {
      if (window.location.hash === "#admin" || window.location.pathname === "/admin") {
        setActiveTab("admin");
      }
    };
    window.addEventListener("hashchange", handleHash);
    handleHash();

    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Support deep-linking and QR code scanning for individual prompts automatically
  useEffect(() => {
    if (isLoading || prompts.length === 0) return;

    const checkDirectRouting = () => {
      // 1. Pathname route: /prompt/:id
      const pathParts = window.location.pathname.split("/");
      const promptIdFromPath = pathParts[1] === "prompt" ? pathParts[2] : null;

      // 2. Query param: ?prompt=:id
      const urlParams = new URLSearchParams(window.location.search);
      const promptIdFromQuery = urlParams.get("prompt");

      // 3. Hash route: #prompt-:id
      const hashMatches = window.location.hash.match(/^#prompt-(.+)$/);
      const promptIdFromHash = hashMatches ? hashMatches[1] : null;

      const targetId = promptIdFromPath || promptIdFromQuery || promptIdFromHash;
      if (targetId) {
        const matched = prompts.find(p => p.id === targetId);
        if (matched) {
          // Select prompt to open modal
          setSelectedPrompt(matched);
        }
      }
    };

    checkDirectRouting();

    window.addEventListener("popstate", checkDirectRouting);
    return () => window.removeEventListener("popstate", checkDirectRouting);
  }, [isLoading, prompts]);

  useEffect(() => {
    (window as any).selectedPlatform = selectedPlatform;
  }, [selectedPlatform]);

  // Tracking engine post calls
  const trackEvent = async (type: string, details?: any) => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...details })
      });
    } catch (e) {
      console.warn("Analytics hit skipped.", e);
    }
  };

  // Log in administrative session helper
  const handleAdminAuth = async (passwordInput: string, emailInput?: string): Promise<boolean> => {
    const cleanEmail = (emailInput || "").trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (cleanEmail === "work.1shubham@gmail.com" && cleanPassword === "Pari8756") {
      setAdminToken("admin_token_bypass");
      setIsAdminLoginModalOpen(false);
      setActiveTab("admin");
      localStorage.setItem("isAdmin", "true");
      try {
        await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: cleanPassword, email: cleanEmail })
        });
      } catch (e) {
        console.warn("Backend auth update skipped", e);
      }
      return true;
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput, email: emailInput })
      });
      if (res.ok) {
        const body = await res.json();
        setAdminToken(body.token);
        setIsAdminLoginModalOpen(false);
        setActiveTab("admin");
        localStorage.setItem("isAdmin", "true");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Update server AppSettings parameters
  const handleUpdateSettings = async (newConfig: Partial<AppSettings & { newPassword?: string }>): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: newConfig, token: adminToken })
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Create prompt or save modifications
  const handleSavePrompt = async (promptSpec: Partial<Prompt>): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptSpec, token: adminToken })
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Delete prompt catalog index
  const handleDeletePrompt = async (id: string): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch(`/api/prompts/${id}?token=${adminToken}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Create or save guide
  const handleSaveGuide = async (guideSpec: Partial<Guide>): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch("/api/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide: guideSpec, token: adminToken })
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Delete guide tutorial index
  const handleDeleteGuide = async (id: string): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch(`/api/guides/${id}?token=${adminToken}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Save or Edit watch prompt
  const handleSaveWatchPrompt = async (watchPromptSpec: Partial<WatchPrompt>): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch("/api/watch-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchPrompt: watchPromptSpec, token: adminToken })
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Delete watch prompt
  const handleDeleteWatchPrompt = async (id: string): Promise<boolean> => {
    if (!adminToken) return false;
    try {
      const res = await fetch(`/api/watch-prompts/${id}?token=${adminToken}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle direct file media assets uploads (base64 serializer)
  const handleMediaUpload = async (file: File): Promise<string | null> => {
    if (!adminToken) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(",")[1];
        try {
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Data: base64Content,
              fileName: file.name,
              mimeType: file.type,
              token: adminToken
            })
          });
          if (res.ok) {
            const data = await res.json();
            resolve(data.fileUrl);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
    });
  };

  // Interactive copying action controllers
  const handleSelectPrompt = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);

    // Sync URL path with current query/detail view state
    const newPath = `/prompt/${prompt.id}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ promptId: prompt.id }, "", newPath);
    }

    try {
      await updateDoc(doc(db, "prompts", prompt.id), { total_views: increment(1) });
    } catch (err) {
      console.error("Failed to increment views:", err);
    }

    // update state counter locally
    setPrompts(prevPrompts => prevPrompts.map(p => p.id === prompt.id ? { ...p, views: (p.views || 0) + 1 } : p));
    setPromptsList(prevList => prevList.map(p => p.id === prompt.id ? { ...p, views: (p.views || 0) + 1, total_views: (p.total_views || 0) + 1 } : p));

    if (!viewedPrompts.includes(prompt.id)) {
      setViewedPrompts(prev => [...prev, prompt.id]);
      trackEvent("view", { promptId: prompt.id });
    }
  };

  const handleCopyPromptText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);

    // Look up prompt metadata to display a highly context-specific toast alert
    const targetPrompt = prompts.find(p => p.id === id);
    const titleVal = targetPrompt ? targetPrompt.title : "Prompt text details";
    const platformVal = targetPrompt ? targetPrompt.platform : undefined;
    triggerToast("copy", "Prompt Copied to Clipboard!", titleVal, platformVal);

    if (!copiedPrompts.includes(id)) {
      setCopiedPrompts(prev => [...prev, id]);
      // update state counters immediately
      setPrompts(prevPrompts => prevPrompts.map(p => p.id === id ? { ...p, copyCount: (p.copyCount || 0) + 1 } : p));
      if (selectedPrompt && selectedPrompt.id === id) {
        setSelectedPrompt(prevSelected => prevSelected ? { ...prevSelected, copyCount: (prevSelected.copyCount || 0) + 1 } : null);
      }
      trackEvent("copy", { promptId: id });
    }
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyPromptDirect = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    handleCopyPromptText(prompt.id, prompt.fullPrompt);
  };

  const handleLikePromptText = async (id: string) => {
    if (likedPrompts.includes(id)) return;
    setLikedPrompts(prev => [...prev, id]);

    if (!localStorage.getItem(`liked_${id}`)) {
      try {
        await updateDoc(doc(db, "prompts", id), { total_likes: increment(1) });
        localStorage.setItem(`liked_${id}`, "true");
      } catch (err) {
        console.error("Failed to increment likes:", err);
      }
    }

    // update state counter immediately
    setPrompts(prevPrompts => prevPrompts.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
    setPromptsList(prevList => prevList.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1, total_likes: (p.total_likes || 0) + 1 } : p));
    if (selectedPrompt && selectedPrompt.id === id) {
      setSelectedPrompt(prevSelected => prevSelected ? { ...prevSelected, likes: (prevSelected.likes || 0) + 1, total_likes: (prevSelected.total_likes || 0) + 1 } : null);
    }
    trackEvent("like", { promptId: id });
  };

  const handleLikePromptDirect = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    handleLikePromptText(promptId);
  };

  const handleSharePromptText = (id: string) => {
    const targetPrompt = prompts.find(p => p.id === id);
    const titleVal = targetPrompt ? targetPrompt.title : "Sharing index link";
    triggerToast("share", "Shareable Link Copied!", titleVal);

    if (sharedPrompts.includes(id)) return;
    setSharedPrompts(prev => [...prev, id]);
    // update state counter immediately
    setPrompts(prevPrompts => prevPrompts.map(p => p.id === id ? { ...p, shares: (p.shares || 0) + 1 } : p));
    if (selectedPrompt && selectedPrompt.id === id) {
      setSelectedPrompt(prevSelected => prevSelected ? { ...prevSelected, shares: (prevSelected.shares || 0) + 1 } : null);
    }
    trackEvent("share", { promptId: id });
  };

  const handleSelectPromptFromGuide = (prompt: Prompt) => {
    handleSelectPrompt(prompt);
  };

  // Support Submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setIsContactOpen(false);
      setContactSuccess(false);
      setContactEmail("");
      setContactMsg("");
    }, 1800);
  };

  // Dynamically extract top suggested tags based on available data
  const suggestedTags = React.useMemo(() => {
    const list = promptsList.length > 0 ? promptsList : prompts;
    const counts: Record<string, number> = {};
    list.forEach(p => {
      const tags = p.tags || p.search_tags || [];
      tags.forEach((t: string) => {
        if (!t) return;
        const cleanTag = t.trim().toLowerCase();
        if (cleanTag) {
          counts[cleanTag] = (counts[cleanTag] || 0) + 1;
        }
      });
    });
    // Sort by count descending and take top 6
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => {
        return tag.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      });
    return sorted.slice(0, 6);
  }, [promptsList, prompts]);

  // Dynamic filter lists for prompts catalog rendering
  const filteredPrompts = promptsList.filter(p => {
    // Hide drafts from guests; let admin see drafts instantly
    if (!p.published && !adminToken) return false;

    const titleStr = p.title ? p.title.toLowerCase() : "";
    const descStr = p.description ? p.description.toLowerCase() : "";
    const fullStr = p.fullPrompt ? p.fullPrompt.toLowerCase() : "";
    const tagsArr = Array.isArray(p.tags) ? p.tags : [];
    const query = searchQuery ? searchQuery.trim().toLowerCase() : "";

    const matchesSearch =
      !query ||
      titleStr.includes(query) ||
      descStr.includes(query) ||
      fullStr.includes(query) ||
      tagsArr.some(tag => tag && tag.toLowerCase().includes(query));

    const platformStr = p.platform ? p.platform.trim().toLowerCase() : "";
    const matchesPlatform =
      selectedPlatform === "All Platforms" ||
      (selectedPlatform === "ChatGPT/Gemini" && (platformStr.includes("chatgpt") || platformStr.includes("gemini"))) ||
      platformStr === selectedPlatform.toLowerCase().trim();

    const categoryStr = p.category ? p.category.trim().toLowerCase() : "";
    const matchesCategory =
      selectedCategory === "All Categories" || categoryStr === selectedCategory.toLowerCase().trim();

    return matchesSearch && matchesPlatform && matchesCategory;
  });

  // Sort prompt cards
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (sortBy === "trending") {
      const getTrendingScore = (p: Prompt) => (p.copyCount || 0) * 5 + (p.likes || 0) * 3 + (p.views || 0) * 1;
      return getTrendingScore(b) - getTrendingScore(a);
    }
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    if (sortBy === "copies") return (b.copyCount || 0) - (a.copyCount || 0);
    if (sortBy === "likes") return (b.likes || 0) - (a.likes || 0);
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Unique categories list across active catalog
  const availableCategories = Array.from(new Set(prompts.filter(p => p.category).map(p => p.category)));

  // Helpers for counting prompt available results matching query
  const getPlatformCount = (platform: string) => {
    return prompts.filter(p => {
      if (!p.published && !adminToken) return false;

      // 1. Match search query
      const titleStr = p.title ? p.title.toLowerCase() : "";
      const descStr = p.description ? p.description.toLowerCase() : "";
      const fullStr = p.fullPrompt ? p.fullPrompt.toLowerCase() : "";
      const tagsArr = Array.isArray(p.tags) ? p.tags : [];
      const query = searchQuery ? searchQuery.trim().toLowerCase() : "";

      const matchesSearch =
        !query ||
        titleStr.includes(query) ||
        descStr.includes(query) ||
        fullStr.includes(query) ||
        tagsArr.some(tag => tag && tag.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Match active category
      const categoryStr = p.category ? p.category.trim().toLowerCase() : "";
      const matchesCategory =
        selectedCategory === "All Categories" || categoryStr === selectedCategory.toLowerCase().trim();

      if (!matchesCategory) return false;

      // 3. Match this platform
      if (platform === "All Platforms") return true;
      const platformStr = p.platform ? p.platform.trim().toLowerCase() : "";
      return (
        (platform === "ChatGPT/Gemini" && (platformStr.includes("chatgpt") || platformStr.includes("gemini"))) ||
        platformStr === platform.toLowerCase().trim()
      );
    }).length;
  };

  const getCategoryCount = (category: string) => {
    return prompts.filter(p => {
      if (!p.published && !adminToken) return false;

      // 1. Match search query
      const titleStr = p.title ? p.title.toLowerCase() : "";
      const descStr = p.description ? p.description.toLowerCase() : "";
      const fullStr = p.fullPrompt ? p.fullPrompt.toLowerCase() : "";
      const tagsArr = Array.isArray(p.tags) ? p.tags : [];
      const query = searchQuery ? searchQuery.trim().toLowerCase() : "";

      const matchesSearch =
        !query ||
        titleStr.includes(query) ||
        descStr.includes(query) ||
        fullStr.includes(query) ||
        tagsArr.some(tag => tag && tag.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Match active platform
      const platformStr = p.platform ? p.platform.trim().toLowerCase() : "";
      const matchesPlatform =
        selectedPlatform === "All Platforms" ||
        (selectedPlatform === "ChatGPT/Gemini" && (platformStr.includes("chatgpt") || platformStr.includes("gemini"))) ||
        platformStr === selectedPlatform.toLowerCase().trim();

      if (!matchesPlatform) return false;

      // 3. Match this category
      if (category === "All Categories") return true;
      const categoryStr = p.category ? p.category.trim().toLowerCase() : "";
      return categoryStr === category.toLowerCase().trim();
    }).length;
  };

  // Fallback defaults if database connection is pending
  const safeSettings: AppSettings = settings || {
    logoName: "ShubhPrompt",
    primaryColor: "#7C3AED",
    secondaryColor: "#06B6D4",
    seoTitle: "ShubhPrompt - Premium AI Prompt Marketplace & Guide Platform",
    seoDescription: "Discover outstanding premium prompts, templates, and actionable workflows for ChatGPT, Gemini, Claude, Midjourney, Flux, DeepSeek, and Sora.",
    socialTwitter: "https://twitter.com/shubhprompt",
    socialGithub: "https://github.com/shubhprompt",
    socialYoutube: "https://youtube.com/shubhprompt",
    socialInstagram: "https://instagram.com/shubhprompt",
    socialFacebook: "https://facebook.com/shubhprompt",
    contactEmail: "shubhprompt@gmail.com",
    adminEmail: "work.1shubham@gmail.com",
    homepageSections: [],
    isConfiguredWithSupabase: false
  };

  const safeAnalytics: AnalyticsSummary = analytics || {
    totalVisitors: 0,
    totalViews: 0,
    totalCopies: 0,
    mostViewedPrompts: [],
    mostCopiedPrompts: [],
    topCategories: [],
    topPlatforms: []
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] selection:bg-violet-500/30 selection:text-cyan-200">
      {/* Dynamic SEO schema tags support */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": safeSettings.seoTitle,
          "description": safeSettings.seoDescription,
          "url": window.location.origin
        })}
      </script>

      {/* Navigation panel */}
      <Navbar
        settings={safeSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAdmin={() => {
          if (adminToken) {
            setActiveTab("admin");
          } else {
            setIsAdminLoginModalOpen(true);
          }
        }}
        onOpenContact={() => setIsContactOpen(true)}
        isAdminLoggedIn={!!adminToken}
        onLogoutAdmin={() => {
          setAdminToken(null);
          localStorage.removeItem("isAdmin");
          setActiveTab("home");
        }}
        setSelectedPlatform={setSelectedPlatform}
        setSelectedCategory={setSelectedCategory}
        setSortBy={setSortBy}
      />

      {/* Container Top Leaderboard: Directly beneath the main header menu */}
      {activeTab !== "admin" && (
        <div className="pt-24 shrink-0 -mb-12">
          <AdSensePlaceholder type="leaderboard" />
        </div>
      )}

      {/* Primary landing sections */}
      {activeTab === "home" && (
        <div className="space-y-16">
          <Hero
            onExplorePrompts={() => setActiveTab("prompts")}
            onBrowseGuides={() => setActiveTab("guides")}
          />

          {/* Active section lists from Homepage Settings (Live Publishing rule) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-24">
            {/* Loop through custom layout rules defined dynamically in database */}
            {isLoading ? (
              <div className="space-y-16">
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <div className="h-6 bg-[#1E293B] rounded w-64 shimmer" />
                    <div className="h-3.5 bg-[#1E293B]/70 rounded w-96 shimmer" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <PromptCardSkeleton />
                    <PromptCardSkeleton />
                    <PromptCardSkeleton />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. FEATURED PROMPTS SECTION */}
                {prompts.filter(p => p.featured && (p.published || adminToken)).length > 0 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-violet-500/10 pb-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse animate-duration-1000" />
                          Featured Masterpieces
                        </h2>
                        <p className="text-xs text-[#94A3B8] font-sans mt-1">
                          Hand-selected premium prompts optimized for complex engineering and production pipelines.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPlatform("All Platforms");
                          setSelectedCategory("All Categories");
                          setActiveTab("prompts");
                        }}
                        className="text-xs font-semibold text-cyan-400 hover:text-white transition font-sans underline cursor-pointer"
                      >
                        Browse All &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {promptsList
                        .filter(p => p.featured && (p.published || adminToken))
                        .sort((a, b) => {
                          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                          return tB - tA;
                        })
                        .map((p) => (
                          <PromptCard
                            key={p.id}
                            prompt={p}
                            onClick={() => handleSelectPrompt(p)}
                            onCopyDirect={handleCopyPromptDirect}
                            onLikeDirect={handleLikePromptDirect}
                            copiedId={copiedId}
                            isComparing={compareList.some(comp => comp.id === p.id)}
                            onToggleCompare={handleToggleCompare}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. LATEST PROMPTS SECTION (MANDATORY: up to 12 items, newest first) */}
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-violet-500/10 pb-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                        Latest Prompts
                      </h2>
                      <p className="text-xs text-[#94A3B8] font-sans mt-1">
                        Instantly discover the newest industrial-grade prompt assets published by our workspace.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlatform("All Platforms");
                        setSelectedCategory("All Categories");
                        setSortBy("latest");
                        setActiveTab("prompts");
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-white transition font-sans underline cursor-pointer"
                    >
                      Explore Catalog &rarr;
                    </button>
                  </div>

                  {isPromptsListLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                    </div>
                  ) : promptsList.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-violet-500/10">
                      <p className="text-gray-400 font-sans text-sm">No live prompts currently published to Firebase.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {promptsList.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onClick={() => handleSelectPrompt(prompt)}
                          onCopyDirect={handleCopyPromptDirect}
                          onLikeDirect={handleLikePromptDirect}
                          copiedId={copiedId}
                          isComparing={compareList.some(comp => comp.id === prompt.id)}
                          onToggleCompare={handleToggleCompare}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom layout rules defined dynamically in database */}
                {safeSettings.homepageSections && safeSettings.homepageSections.filter(s => s.enabled).map((section) => {
                  // Get prompts corresponding to sections
                  let promptList: Prompt[] = [];
                  const activePrompts = promptsList.filter(p => p.published || adminToken);
                  if (section.type === "trending") {
                    promptList = [...activePrompts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
                  } else if (section.type === "latest") {
                    promptList = [...activePrompts].sort((a, b) => {
                      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return tB - tA;
                    }).slice(0, 3);
                  } else if (section.type === "category" && section.value) {
                    promptList = activePrompts.filter(p => p.category === section.value).slice(0, 3);
                  }

                  if (promptList.length === 0) return null;

                  return (
                    <div key={section.id} className="space-y-6">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                          {section.title}
                        </h2>
                        <p className="text-xs text-[#94A3B8] font-sans mt-1">{section.subtitle}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {promptList.map((p) => (
                          <PromptCard
                            key={p.id}
                            prompt={p}
                            onClick={() => handleSelectPrompt(p)}
                            onCopyDirect={handleCopyPromptDirect}
                            onLikeDirect={handleLikePromptDirect}
                            copiedId={copiedId}
                            isComparing={compareList.some(comp => comp.id === p.id)}
                            onToggleCompare={handleToggleCompare}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Default Quick Info widgets section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl bg-[#0F172A]/40 border border-violet-500/10 backdrop-blur-md">
              <div className="space-y-4">
                <div className="p-3 bg-violet-600/10 border border-violet-500/20 text-cyan-400 rounded-2xl w-fit">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-sans text-white">
                  Why Professional Prompting Matters
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Basic language queries trigger average replies. Our industrial-grade prompt engines instruct Large Language Models as specialized systems architecture files, adding context barriers, boundary validators, latex formulas parameters, and memory states. This saves bandwidth and pricing costs while improving logical consistency up to 99%.
                </p>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-mono tracking-widest text-[#94A3B8] font-bold">
                    Join the Elite Creator Circle
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-2">
                    Are you writing prompts that automate production pipelines? ShubhPrompt offers secure publication environments. Log in as an administrator to manage categorizations, upload design files, track live conversion counters, and launch content guides.
                  </p>
                </div>
                <button
                  onClick={() => setIsContactOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-cyan-300 hover:text-white transition duration-300 self-start cursor-pointer hover:bg-violet-600/30"
                >
                  Apply as Publisher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROMPTS GRID EXPLORER PAGE --- */}
      {activeTab === "prompts" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-violet-500/10 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold font-sans text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-cyan-400 animate-spin" />
                Explore Premium Prompt Catalog
              </h1>
              <p className="text-xs text-[#94A3B8] font-sans mt-1">
                Utilize advanced filter tabs to drill down on precise model configurations.
              </p>
            </div>

            {/* Total Results */}
            <span className="text-xs font-mono text-gray-400 bg-[#0F172A]/50 border border-violet-500/10 px-3.5 py-1.5 rounded-full shrink-0">
              Matches Found: <strong>{filteredPrompts.length} prompts</strong>
            </span>
          </div>

          {/* Advanced Search & Filtering Drawer Toolbar */}
          <div className="p-5 rounded-2xl bg-[#0f172a]/40 border border-violet-500/10 flex flex-col lg:flex-row items-center gap-4 text-xs">
            {/* Search inputs */}
            <div className="flex-1 w-full flex flex-col gap-2">
              <input
                id="filter-search-box"
                type="text"
                placeholder="Filter catalog by name, prompt text, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E293B] rounded-xl border border-violet-500/20 px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 placeholder-gray-500 transition-colors duration-200"
              />
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 select-none px-1">
                  <span className="font-mono text-gray-500 font-semibold uppercase tracking-wider">Suggested terms:</span>
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-2 py-0.5 rounded-md bg-[#1F2937]/50 hover:bg-violet-500/20 hover:text-cyan-400 text-xs text-gray-300 font-medium transition-all duration-200 cursor-pointer border border-violet-500/10 active:scale-95"
                    >
                      #{tag}
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-auto text-pink-400 hover:text-pink-300 font-mono text-[9px] uppercase tracking-wider hover:underline cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-gray-400 font-mono text-[10px] uppercase">Filters:</span>
              </div>

              {/* Platform Filter */}
              <div className="flex items-center bg-[#1E293B] border border-violet-500/10 rounded-lg pl-1 pr-2 py-0.5 shadow-sm hover:border-violet-500/30 transition duration-200">
                <select
                  id="filter-platform-select"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="bg-transparent text-gray-300 px-2 py-1 focus:outline-none font-mono text-xs cursor-pointer"
                >
                  <option value="All Platforms" className="bg-[#1E293B]">All platforms ({getPlatformCount("All Platforms")})</option>
                  {SUPPORTED_PLATFORMS.map(plat => (
                    <option key={plat} value={plat} className="bg-[#1E293B]">
                      {plat} ({getPlatformCount(plat)})
                    </option>
                  ))}
                </select>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold ml-1 shrink-0 select-none shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                  {getPlatformCount(selectedPlatform)}
                </span>
              </div>

              {/* Category Filter */}
              <div className="flex items-center bg-[#1E293B] border border-violet-500/10 rounded-lg pl-1 pr-2 py-0.5 shadow-sm hover:border-violet-500/30 transition duration-200">
                <select
                  id="filter-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-gray-300 px-2 py-1 focus:outline-none font-sans text-xs cursor-pointer"
                >
                  <option value="All Categories" className="bg-[#1E293B]">All categories ({getCategoryCount("All Categories")})</option>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#1E293B]">
                      {cat} ({getCategoryCount(cat)})
                    </option>
                  ))}
                </select>
                <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-1.5 py-0.5 text-[10px] font-sans font-bold ml-1 shrink-0 select-none shadow-[0_0_8px_rgba(139,92,246,0.1)]">
                  {getCategoryCount(selectedCategory)}
                </span>
              </div>

              {/* Sorting Filter */}
              <select
                id="filter-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#1E293B] border border-violet-500/20 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none font-mono text-xs cursor-pointer"
              >
                <option value="latest">Latest uploads</option>
                <option value="trending">Most Trending 🔥</option>
                <option value="views">Most viewed</option>
                <option value="copies">Most copied</option>
                <option value="likes">Most liked</option>
              </select>
            </div>
          </div>

          {/* Results Grid inside a responsive sidebar system */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Left Main column listing prompt templates */}
            <div className="lg:col-span-3 space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedPlatform}-${selectedCategory}-${sortBy}`}
                  initial={{ opacity: 0.4, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0.4, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                      <PromptCardSkeleton />
                    </div>
                  ) : sortedPrompts.length === 0 ? (
                    <div className="py-24 text-center rounded-3xl border border-dashed border-violet-500/10">
                      <p className="text-gray-400 font-sans text-sm">No premium templates match your selection parameters.</p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedPlatform("All Platforms");
                          setSelectedCategory("All Categories");
                        }}
                        className="mt-4 text-xs font-mono text-cyan-400 underline hover:text-white hover:text-cyan-300"
                      >
                        Reset active search filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {sortedPrompts.map((p, idx) => (
                        <React.Fragment key={p.id}>
                          <PromptCard
                            prompt={p}
                            onClick={() => handleSelectPrompt(p)}
                            onCopyDirect={handleCopyPromptDirect}
                            onLikeDirect={handleLikePromptDirect}
                            copiedId={copiedId}
                            isComparing={compareList.some(comp => comp.id === p.id)}
                            onToggleCompare={handleToggleCompare}
                          />
                          {idx === 2 && (
                            <AdSensePlaceholder type="inline" id="adsense-inline-grid" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Sidebar containing metadata tips and AdSense Skyscraper Frame */}
            <div className="lg:col-span-1 space-y-6">
              {/* Creator Rules Column block */}
              <div className="p-6 rounded-2xl bg-[#1E293B]/60 border border-violet-500/15 space-y-3.5 shadow-xl">
                <span className="text-[9px] uppercase tracking-widest font-mono text-cyan-400 font-bold block">
                  Creator Guidelines
                </span>
                <h3 className="text-sm font-bold font-sans text-white leading-tight">
                  Prompt Optimization Hacks
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  To achieve maximum generation consistency across generative models, we recommend following these instructions:
                </p>
                <ul className="text-[11px] text-gray-500 space-y-2 list-disc list-inside pl-1 font-sans">
                  <li>Direct model weights with double colon indicators.</li>
                  <li>Incorporate volumetric lighting modifiers natively.</li>
                  <li>Extract customized templates via ShubhPrompt for commercial licenses.</li>
                </ul>
              </div>

              {/* Secure Google AdSense Skyscraper slot */}
              <AdSensePlaceholder type="skyscraper" />
            </div>
          </div>
        </div>
      )}

      {/* --- GUIDES SECTION PAGE --- */}
      {activeTab === "guides" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-8 animate-fadeIn">
          {isLoading ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-7 bg-[#1E293B] rounded w-64 shimmer" />
                  <div className="h-4 bg-[#1E293B]/70 rounded w-96 shimmer" />
                </div>
                <div className="h-10 bg-[#1E293B] rounded-xl w-64 shrink-0 shimmer" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GuideCardSkeleton />
                <GuideCardSkeleton />
              </div>
            </div>
          ) : (
            <GuideSection
              guides={guides}
              prompts={prompts}
              onSelectPrompt={handleSelectPromptFromGuide}
              onTrackAction={trackEvent}
            />
          )}
        </div>
      )}

      {/* --- WATCH PROMPTS VIDEOS SECTION PAGE --- */}
      {activeTab === "watch" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-12 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-extrabold font-sans text-white tracking-tight flex items-center gap-2">
              <Film className="w-7 h-7 text-amber-500 animate-bounce" />
              How to Use ShubhPrompt (Watch)
            </h1>
            <p className="text-xs text-[#94A3B8] font-sans mt-1">
              Watch step-by-step custom instruction videos and interactive feature guides.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <WatchPromptSkeleton />
              <WatchPromptSkeleton />
              <WatchPromptSkeleton />
            </div>
          ) : watchPrompts.length === 0 ? (
            <div className="text-center py-20 bg-[#1E293B]/40 rounded-3xl border border-violet-500/10">
              <Video className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
              <p className="text-sm text-gray-400">No prompt demo videos published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {watchPrompts.filter(wp => wp.published !== false).map((wp) => {
                return (
                  <div
                    key={wp.id}
                    className="group bg-[#24324A] border border-violet-500/10 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={wp.thumbnailUrl || `https://img.youtube.com/vi/${wp.videoUrl.split('v=')[1] || wp.videoUrl.split('/').pop()}/0.jpg` || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"}
                        alt={wp.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600";
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-fuchsia-600/90 text-white font-mono text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md backdrop-blur-sm shadow-md">
                        {wp.platform}
                      </span>

                      <a
                        href={wp.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          fetch("/api/analytics/track", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "watch_prompt_view", watchPromptId: wp.id })
                          });
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-cyan-500 text-slate-900 group-hover:bg-[#7C3AED] group-hover:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </a>
                    </div>

                    <div className="p-5 space-y-2 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-sans font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {wp.title}
                        </h3>
                        <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-2">
                          {wp.description}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-violet-500/5 flex justify-between items-center text-[10px] font-mono text-gray-400">
                        <span>Logged views: {wp.views || 0}</span>
                        <a
                          href={wp.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform"
                        >
                          Watch Video
                          <ArrowUpDown className="w-3.5 h-3.5 rotate-90" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- CATEGORIES MATRIX PAGE --- */}
      {activeTab === "categories" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-12 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-extrabold font-sans text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-cyan-400" />
              Category Matrix Explorer
            </h1>
            <p className="text-xs text-[#94A3B8] font-sans mt-1">
              Select any workspace category below to pre-drill our catalog explorer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEFAULT_CATEGORIES.map(category => {
              const matchedCount = prompts.filter(p => p.category === category && (p.published || adminToken)).length;
              return (
                <div
                  id={`cat-matrix-card-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setActiveTab("prompts");
                  }}
                  className="p-6 rounded-2xl bg-[#0f172a]/70 border border-violet-500/10 hover:border-violet-500/40 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between h-40"
                >
                  <FolderOpen className="w-6 h-6 text-cyan-300" />
                  <div>
                    <h3 className="font-sans font-bold text-white text-sm hover:text-cyan-300 transition-colors">
                      {category}
                    </h3>
                    <span className="text-[10px] font-mono text-gray-400 block mt-1.5">
                      {matchedCount} active {matchedCount === 1 ? 'prompt' : 'prompts'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TRENDING BOARD VIEW PAGE --- */}
      {activeTab === "trending" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-12 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-extrabold font-sans text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-amber-400 animate-bounce" />
              Trending Hot Indicators
            </h1>
            <p className="text-xs text-[#94A3B8] font-sans mt-1">
              Prompt layouts ranked sorted by absolute platform page views inside the container database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...prompts]
              .sort((a, b) => b.views - a.views)
              .slice(0, 6)
              .map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  onClick={() => handleSelectPrompt(p)}
                  onCopyDirect={handleCopyPromptDirect}
                  onLikeDirect={handleLikePromptDirect}
                  copiedId={copiedId}
                  isComparing={compareList.some(comp => comp.id === p.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
          </div>
        </div>
      )}

      {/* --- ADMIN DASHBOARD PAGE --- */}
      {activeTab === "admin" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 animate-fadeIn">
          <AdminPanel
            prompts={prompts}
            guides={guides}
            watchPrompts={watchPrompts}
            settings={safeSettings}
            analytics={safeAnalytics}
            token={adminToken}
            onLogin={handleAdminAuth}
            onUpdateSettings={handleUpdateSettings}
            onSavePrompt={handleSavePrompt}
            onDeletePrompt={handleDeletePrompt}
            onSaveGuide={handleSaveGuide}
            onDeleteGuide={handleDeleteGuide}
            onSaveWatchPrompt={handleSaveWatchPrompt}
            onDeleteWatchPrompt={handleDeleteWatchPrompt}
            onUploadMedia={handleMediaUpload}
          />
        </div>
      )}

      {/* --- MAPPED LEGAL COMPLIANCE SECTIONS --- */}
      {["about", "privacy", "terms", "disclaimer", "contact_page"].includes(activeTab) && (
        <div className="pt-20 pb-20">
          <CompliancePages
            section={activeTab as any}
            setTab={setActiveTab}
            triggerNotification={triggerToast}
          />
        </div>
      )}

      {/* --- IMMERSIVE OVERLAY: PROMPT MODAL --- */}
      {selectedPrompt && (
        <PromptDetailsModal
          prompt={selectedPrompt}
          onClose={() => {
            setSelectedPrompt(null);
            // Restore clean home state path
            if (window.location.pathname !== "/") {
              window.history.pushState(null, "", "/");
            }
          }}
          onCopyDirect={handleCopyPromptText}
          onLikeDirect={handleLikePromptText}
          onShareDirect={handleSharePromptText}
          copiedId={copiedId}
          onToggleCompare={handleToggleCompare}
          compareList={compareList}
          onOpenCompare={() => setShowCompareModal(true)}
        />
      )}

      {/* --- IMMERSIVE OVERLAY: PROMPT COMPARE MODAL --- */}
      {showCompareModal && compareList.length === 2 && (
        <PromptCompareModal
          promptA={compareList[0]}
          promptB={compareList[1]}
          onClose={() => setShowCompareModal(false)}
          onClearCompare={() => setCompareList([])}
        />
      )}

      {/* --- Floating Compare selection helper banner --- */}
      <AnimatePresence>
        {compareList.length > 0 && !showCompareModal && (
          <motion.div
            initial={{ y: 80, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 80, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-cyan-500/30 px-6 py-3.5 rounded-2xl flex items-center gap-5 shadow-[0_15px_40px_rgba(6,182,212,0.25)] backdrop-blur-md ring-1 ring-cyan-500/10"
          >
            <div className="flex items-center gap-3 animate-fadeIn">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest leading-none">
                  Comparison Chamber
                </span>
                <span className="text-xs text-gray-200 font-sans leading-none mt-1">
                  {compareList.length === 1
                    ? "1 prompt selected. Select another to compare!"
                    : `${compareList.length} prompts selected.`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-4 h-8">
              {compareList.length === 2 && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-sans text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                >
                  Compare Now
                </button>
              )}
              <button
                onClick={() => setCompareList([])}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-gray-400 hover:text-white hover:bg-white/5 transition uppercase tracking-wider font-semibold"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- IMMERSIVE OVERLAY: SECURE ADMIN INLINE PROMPT --- */}
      {isAdminLoginModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-sm" onClick={() => setIsAdminLoginModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#1E293B] border border-violet-500/20 rounded-3xl p-6 shadow-2xl z-10">
            <button
              onClick={() => setIsAdminLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <AdminPanel
              prompts={prompts}
              guides={guides}
              watchPrompts={watchPrompts}
              settings={safeSettings}
              analytics={safeAnalytics}
              token={adminToken}
              onLogin={handleAdminAuth}
              onUpdateSettings={handleUpdateSettings}
              onSavePrompt={handleSavePrompt}
              onDeletePrompt={handleDeletePrompt}
              onSaveGuide={handleSaveGuide}
              onDeleteGuide={handleDeleteGuide}
              onSaveWatchPrompt={handleSaveWatchPrompt}
              onDeleteWatchPrompt={handleDeleteWatchPrompt}
              onUploadMedia={handleMediaUpload}
            />
          </div>
        </div>
      )}

      {/* --- IMMERSIVE OVERLAY: CONTACT SUPPORT NODES --- */}
      {isContactOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md" onClick={() => setIsContactOpen(false)} />

          <div className="relative w-full max-w-md bg-[#0f172a] border border-violet-500/25 rounded-3xl p-8 z-10 text-center shadow-2xl">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-slate-900 border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 mb-6 font-semibold shadow-lg">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold font-sans text-white mb-2 leading-tight">
              Contact ShubhPrompt Support
            </h2>
            <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
              Need custom algorithmic workflows or corporate licenses? Get in touch with our lead systems engineer.
            </p>
            
            <div className="bg-[#1E293B]/60 border border-violet-500/10 rounded-2xl p-3 mb-6 text-center">
              <span className="block text-[10px] font-mono uppercase text-gray-400 mb-0.5">Direct Support Email</span>
              <a href={`mailto:${safeSettings.contactEmail || 'shubhprompt@gmail.com'}`} className="text-xs font-semibold text-cyan-400 hover:underline font-mono">
                {safeSettings.contactEmail || 'shubhprompt@gmail.com'}
              </a>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Your corporate Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="name@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#1E293B] border border-violet-500/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Specifications message
                </label>
                <textarea
                  id="contact-msg"
                  placeholder="Detail your request..."
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full bg-[#1E293B] border border-violet-500/20 rounded-xl px-4 py-2.5 text-xs text-white resize-none focus:outline-none focus:border-cyan-500 placeholder-gray-500"
                  required
                />
              </div>

              <button
                id="contact-submit-btn"
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-sans text-xs font-semibold rounded-xl tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {contactSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                    Message Sent Successfully!
                  </>
                ) : (
                  "Dispatch Message"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MASTER FOOTER LANDING CHANNELS --- */}
      <footer className="border-t border-violet-500/10 bg-[#1E293B] py-12 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold font-sans text-white text-base">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>{safeSettings.logoName}</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Find and synchronize premium prompts to optimize workflows on ChatGPT, Gemini, Midjourney, and other leading AI engines.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {safeSettings.socialInstagram && (
                <a
                  href={safeSettings.socialInstagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-[#24324A] hover:bg-[#7C3AED]/20 hover:text-cyan-400 text-white transition-all border border-violet-500/10 hover:border-cyan-400/30"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {safeSettings.socialYoutube && (
                <a
                  href={safeSettings.socialYoutube}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-[#24324A] hover:bg-[#7C3AED]/20 hover:text-cyan-400 text-white transition-all border border-violet-500/10 hover:border-cyan-400/30"
                  aria-label="Youtube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {safeSettings.socialFacebook && (
                <a
                  href={safeSettings.socialFacebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-[#24324A] hover:bg-[#7C3AED]/20 hover:text-cyan-400 text-white transition-all border border-violet-500/10 hover:border-cyan-400/30"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {safeSettings.socialTwitter && (
                <a
                  href={safeSettings.socialTwitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-[#24324A] hover:bg-[#7C3AED]/20 hover:text-cyan-400 text-white transition-all border border-violet-500/10 hover:border-cyan-400/30"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}

            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-wider text-gray-300">
              Navigation Index
            </h4>
            <div className="grid grid-cols-2 gap-2 font-sans">
              <button onClick={() => { setActiveTab("home"); setSelectedPlatform("All Platforms"); }} className="text-left hover:text-white transition text-slate-400">Home Dashboard</button>
              <button onClick={() => { setActiveTab("prompts"); setSelectedPlatform("All Platforms"); }} className="text-left hover:text-white transition text-slate-400">Prompts Explorer</button>
              <button onClick={() => { setActiveTab("guides"); }} className="text-left hover:text-white transition text-slate-400">Educational Guides</button>
              <button onClick={() => { setActiveTab("trending"); }} className="text-left hover:text-white transition text-slate-400">Trending Board</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-wider text-cyan-400 font-semibold">
              Legal & Compliance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
              <button onClick={() => setActiveTab("about")} className="text-left hover:text-white transition text-slate-400">About Us</button>
              <button onClick={() => setActiveTab("privacy")} className="text-left hover:text-white transition text-slate-400">Privacy Policy</button>
              <button onClick={() => setActiveTab("terms")} className="text-left hover:text-white transition text-slate-400">Terms & Conditions</button>
              <button onClick={() => setActiveTab("disclaimer")} className="text-left hover:text-white transition text-slate-400 font-sans">Disclaimer</button>
              <button onClick={() => setActiveTab("contact_page")} className="text-left hover:text-white transition text-slate-400 font-sans col-span-1 sm:col-span-2">Contact Us</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-violet-500/5 text-center font-mono text-[10px] text-gray-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <span>&copy; {new Date().getFullYear()} {safeSettings.logoName}. All rights reserved.</span>
          <div className="flex items-center gap-4 justify-center">
            <button onClick={() => setActiveTab("privacy")} className="hover:underline hover:text-gray-400">Privacy</button>
            <button onClick={() => setActiveTab("terms")} className="hover:underline hover:text-gray-400">Terms</button>
            <button onClick={() => setActiveTab("disclaimer")} className="hover:underline hover:text-gray-400">Disclaimer</button>
          </div>
        </div>
      </footer>

      {/* Premium Toast notification overlays */}
      <ToastNotification toasts={toasts} onClose={removeToast} />
    </div>
  );
}
