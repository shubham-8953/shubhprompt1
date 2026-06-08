import React, { useState, useRef, useEffect } from "react";
import { Prompt, Guide, WatchPrompt, AppSettings, AnalyticsSummary, SUPPORTED_PLATFORMS, DEFAULT_CATEGORIES } from "../types";
import {
  Sliders,
  Settings,
  Plus,
  BookOpen,
  Sparkles,
  PieChart,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Copy,
  Upload,
  Video,
  FileImage,
  Globe,
  Share2,
  Lock,
  Loader2,
  Check,
  Power,
  TrendingUp,
  Award,
  RefreshCw,
  FolderOpen,
  CopyCheck,
  Tag,
  EyeOff,
  Files
} from "lucide-react";

interface AdminPanelProps {
  prompts: Prompt[];
  guides: Guide[];
  watchPrompts: WatchPrompt[];
  settings: AppSettings;
  analytics: AnalyticsSummary;
  token: string | null;
  onLogin: (password: string, email?: string) => Promise<boolean>;
  onUpdateSettings: (config: Partial<AppSettings & { newPassword?: string }>) => Promise<boolean>;
  onSavePrompt: (prompt: Partial<Prompt>) => Promise<boolean>;
  onDeletePrompt: (id: string) => Promise<boolean>;
  onSaveGuide: (guide: Partial<Guide>) => Promise<boolean>;
  onDeleteGuide: (id: string) => Promise<boolean>;
  onSaveWatchPrompt: (wp: Partial<WatchPrompt>) => Promise<boolean>;
  onDeleteWatchPrompt: (id: string) => Promise<boolean>;
  onUploadMedia: (file: File) => Promise<string | null>;
}

export default function AdminPanel({
  prompts,
  guides,
  watchPrompts = [],
  settings,
  analytics,
  token,
  onLogin,
  onUpdateSettings,
  onSavePrompt,
  onDeletePrompt,
  onSaveGuide,
  onDeleteGuide,
  onSaveWatchPrompt,
  onDeleteWatchPrompt,
  onUploadMedia
}: AdminPanelProps) {
  // Authentication states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Layout tabs inside Admin
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "prompts" | "guides" | "watch_prompts" | "media" | "categories" | "analytics" | "settings"
  >("dashboard");

  // Forms state
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);
  
  // Sorting state for prompt admin view
  const [promptSortBy, setPromptSortBy] = useState<
    "createdAt-desc" | "createdAt-asc" | "popularity-desc" | "popularity-asc" | "status-published" | "status-draft"
  >("createdAt-desc");

  // Derived sorted prompts strictly scoped inside the admin catalog view
  const sortedPrompts = [...prompts].sort((a, b) => {
    switch (promptSortBy) {
      case "createdAt-desc": {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }
      case "createdAt-asc": {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      }
      case "popularity-desc":
        return (b.views || 0) - (a.views || 0);
      case "popularity-asc":
        return (a.views || 0) - (b.views || 0);
      case "status-published": {
        const aPub = a.published !== false ? 1 : 0;
        const bPub = b.published !== false ? 1 : 0;
        return bPub - aPub;
      }
      case "status-draft": {
        const aDraft = a.published !== false ? 0 : 1;
        const bDraft = b.published !== false ? 0 : 1;
        return bDraft - aDraft;
      }
      default:
        return 0;
    }
  });
  const [editingGuide, setEditingGuide] = useState<Partial<Guide> | null>(null);
  const [editingWatchPrompt, setEditingWatchPrompt] = useState<Partial<WatchPrompt> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Custom state-driven delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "prompt" | "guide" | "watch_prompt";
    id: string;
    title: string;
  } | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsSaving(true);
    try {
      if (deleteConfirm.type === "prompt") {
        await onDeletePrompt(deleteConfirm.id);
      } else if (deleteConfirm.type === "guide") {
        await onDeleteGuide(deleteConfirm.id);
      } else if (deleteConfirm.type === "watch_prompt") {
        await onDeleteWatchPrompt(deleteConfirm.id);
      }
    } catch (err) {
      console.error("Deletion error:", err);
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  // Upload feedback states
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMediaList, setUploadedMediaList] = useState<string[]>([
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600"
  ]);

  // Settings inputs state
  const [logoName, setLogoName] = useState(settings.logoName || "ShubhPrompt");
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(settings.seoDescription || "");
  const [socialTwitter, setSocialTwitter] = useState(settings.socialTwitter || "");
  const [socialGithub, setSocialGithub] = useState(settings.socialGithub || "");
  const [socialYoutube, setSocialYoutube] = useState(settings.socialYoutube || "");
  const [socialInstagram, setSocialInstagram] = useState(settings.socialInstagram || "");
  const [socialFacebook, setSocialFacebook] = useState(settings.socialFacebook || "");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || "shubhprompt@gmail.com");
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || "admin@shubhprompt.online");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const coverFileRef = useRef<HTMLInputElement>(null);
  const previewsFileRef = useRef<HTMLInputElement>(null);
  const guideFeaturedRef = useRef<HTMLInputElement>(null);
  const mediaUploaderRef = useRef<HTMLInputElement>(null);

  // Sync settings inputs when prop values change
  useEffect(() => {
    if (settings) {
      setLogoName(settings.logoName);
      setSeoTitle(settings.seoTitle);
      setSeoDescription(settings.seoDescription);
      setSocialTwitter(settings.socialTwitter);
      setSocialGithub(settings.socialGithub);
      setSocialYoutube(settings.socialYoutube);
      setSocialInstagram(settings.socialInstagram || "");
      setSocialFacebook(settings.socialFacebook || "");
      setContactEmail(settings.contactEmail || "shubhprompt@gmail.com");
      setAdminEmail(settings.adminEmail || "admin@shubhprompt.online");
    }
  }, [settings]);

  // Login handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const ok = await onLogin(password, email);
      if (!ok) {
        setLoginError("Incorrect administrator credentials supplied.");
      }
    } catch {
      setLoginError("Server authorization query failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Image uploader abstraction helper
  const triggerMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: "cover" | "guideFeatured" | "promptPreviews" | "mediaLibrary"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFeedback("Analyzing file payload...");
    setIsUploading(true);

    try {
      const fileUrl = await onUploadMedia(file);
      if (fileUrl) {
        setUploadedMediaList((prev) => [fileUrl, ...prev]);

        if (targetField === "cover" && editingPrompt) {
          setEditingPrompt({ ...editingPrompt, coverImage: fileUrl });
          setUploadFeedback("Cover image updated!");
        } else if (targetField === "guideFeatured" && editingGuide) {
          setEditingGuide({ ...editingGuide, featuredImage: fileUrl });
          setUploadFeedback("Featured illustrative image updated!");
        } else if (targetField === "promptPreviews" && editingPrompt) {
          const previews = editingPrompt.previewImages ? [...editingPrompt.previewImages] : [];
          previews.push(fileUrl);
          setEditingPrompt({ ...editingPrompt, previewImages: previews });
          setUploadFeedback("Preview photo added successfully!");
        } else if (targetField === "mediaLibrary") {
          setUploadFeedback("Media uploaded and cataloged!");
        }
      } else {
        setUploadFeedback("Upload failed. Verify server storage configurations.");
      }
    } catch (err) {
      setUploadFeedback("Operation aborted.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadFeedback(null), 3000);
    }
  };

  // Save changes to database
  const handleSavePromptClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt?.title || !editingPrompt?.fullPrompt || !editingPrompt?.platform) {
      alert("Please provide at least a Title, Platform, and full algorithmic directions.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let tagsArr: string[] = [];
      if (typeof editingPrompt.tags === "string") {
        tagsArr = (editingPrompt.tags as string)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);
      } else if (Array.isArray(editingPrompt.tags)) {
        tagsArr = editingPrompt.tags;
      }

      const payload = {
        ...editingPrompt,
        tags: tagsArr,
        published: editingPrompt.published !== false,
        featured: editingPrompt.featured === true,
        coverImage: editingPrompt.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"
      };

      const result = await onSavePrompt(payload);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => {
          setEditingPrompt(null);
          setSaveSuccess(false);
        }, 1200);
      }
    } catch (err) {
      alert("Error saving metadata record.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Guide handler
  const handleSaveGuideClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuide?.title || !editingGuide?.content) {
      alert("Please enter a Guide Title and content directions.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let tagsArr: string[] = [];
      if (typeof editingGuide.tags === "string") {
        tagsArr = (editingGuide.tags as string)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);
      } else if (Array.isArray(editingGuide.tags)) {
        tagsArr = editingGuide.tags;
      }

      let relatesArr: string[] = [];
      if (typeof editingGuide.relatedPrompts === "string") {
        relatesArr = (editingGuide.relatedPrompts as string)
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      } else if (Array.isArray(editingGuide.relatedPrompts)) {
        relatesArr = editingGuide.relatedPrompts;
      }

      const payload = {
        ...editingGuide,
        tags: tagsArr,
        relatedPrompts: relatesArr,
        featuredImage: editingGuide.featuredImage || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600"
      };

      const ok = await onSaveGuide(payload);
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setEditingGuide(null);
          setSaveSuccess(false);
        }, 1200);
      }
    } catch {
      alert("Unable to update guide catalog.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Watch Prompt handler
  const handleSaveWatchPromptClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWatchPrompt?.title || !editingWatchPrompt?.videoUrl || !editingWatchPrompt?.platform) {
      alert("Please enter a Title, YouTube URL, and Target Platform.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...editingWatchPrompt,
        published: editingWatchPrompt.published !== false
      };

      const ok = await onSaveWatchPrompt(payload);
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setEditingWatchPrompt(null);
          setSaveSuccess(false);
        }, 1200);
      }
    } catch {
      alert("Unable to write watch prompt.");
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate prompt record helper
  const handleDuplicatePrompt = (p: Prompt) => {
    setEditingPrompt({
      title: `${p.title} (Copy)`,
      description: p.description,
      fullPrompt: p.fullPrompt,
      category: p.category,
      platform: p.platform,
      tags: [...p.tags],
      coverImage: p.coverImage,
      previewImages: [...p.previewImages],
      animation: p.animation,
      videoDemo: p.videoDemo,
      published: p.published
    });
    setActiveTab("prompts");
  };

  // Settings Save handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const ok = await onUpdateSettings({
        logoName,
        seoTitle,
        seoDescription,
        socialTwitter,
        socialGithub,
        socialYoutube,
        socialInstagram,
        socialFacebook,
        contactEmail,
        adminEmail,
        ...(newAdminPassword && { newPassword: newAdminPassword })
      });
      if (ok) {
        setSaveSuccess(true);
        setNewAdminPassword("");
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch {
      alert("Configuration write error.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper metrics calculations
  const totalViews = prompts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalCopies = prompts.reduce((sum, p) => sum + (p.copyCount || 0), 0);
  const totalLikes = prompts.reduce((sum, p) => sum + (p.likes || 0), 0);

  // Guard login check
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl z-0" />

        <div className="relative w-full max-w-md bg-[#1F2A44] border border-violet-500/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10 backdrop-blur-xl text-center">
          <div className="inline-flex p-3 rounded-full bg-violet-600/10 border border-violet-500/20 text-cyan-400 mb-6">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl md:text-2xl font-bold font-sans text-white mb-2">
            Storefront Control Console
          </h2>
          <p className="text-xs text-gray-400 font-mono mb-6">
            Enter administrator email and password key to access CMS portal files.
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold font-sans">
                Admin Email Address
              </label>
              <input
                id="admin-email-input"
                type="email"
                placeholder="admin@shubhprompt.online"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder-gray-500 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold font-sans">
                Admin Console Password
              </label>
              <input
                id="admin-passwd-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder-gray-500 font-mono tracking-widest"
                required
              />
            </div>

            {loginError && (
              <p className="text-[#EF4444] text-[11px] font-mono bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10">
                {loginError}
              </p>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-sans text-sm font-semibold rounded-xl transition duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  Authenticating console...
                </>
              ) : (
                "Unlock System Panel"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Custom state-driven delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1E293B] border border-violet-500/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                Confirm Permanent Removal
              </h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Are you absolutely sure you want to delete <span className="text-rose-400 font-semibold font-mono">"{deleteConfirm.title}"</span>? This action is irreversible.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 font-sans text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-xl border border-violet-500/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upper Title Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-2xl border border-violet-500/10">
        <div>
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase font-bold tracking-wider">
            Connected to Supabase DB
          </span>
          <h1 className="text-2xl font-bold font-sans text-white mt-1.5">
            Storefront Console
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-1">
            Running dynamic live content updates. Changes reflect instantly to viewers.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F172A] border border-cyan-500/15">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-cyan-300 font-bold">
            Live Synchronizations Active
          </span>
        </div>
      </div>

      {/* Admin Module Navigation Tabs (8 distinct tabs) */}
      <div className="flex flex-wrap gap-1 border-b border-violet-500/15 pb-2.5">
        {[
          { id: "dashboard", label: "Dashboard", icon: Award },
          { id: "prompts", label: "Prompts", icon: Sparkles },
          { id: "guides", label: "Guides", icon: BookOpen },
          { id: "watch_prompts", label: "Watch Prompts", icon: Video },
          { id: "media", label: "Media Library", icon: FileImage },
          { id: "categories", label: "Categories", icon: FolderOpen },
          { id: "analytics", label: "Analytics", icon: PieChart },
          { id: "settings", label: "Settings", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setEditingPrompt(null);
                setEditingGuide(null);
                setEditingWatchPrompt(null);
              }}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
                isActive
                  ? "text-cyan-300 bg-[#7C3AED]/20 border-b border-cyan-300/40 font-bold"
                  : "text-gray-400 hover:text-white hover:bg-[#1E293B]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-300" : "text-gray-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- MODULE 1: INTERACTIVE UNIFIED HOME DASHBOARD --- */}
      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Prompt Catalog Size</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{prompts.length}</span>
              <span className="text-[10px] font-mono text-emerald-400 block mt-2">Active prompts ready</span>
            </div>
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Video Demos</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{watchPrompts.length}</span>
              <span className="text-[10px] font-mono text-cyan-400 block mt-2">Dynamic watch clips</span>
            </div>
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Guides Published</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{guides.length}</span>
              <span className="text-[10px] font-mono text-pink-400 block mt-2">Interactive manuals</span>
            </div>
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Interactions</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{(totalViews + totalCopies + totalLikes).toLocaleString()}</span>
              <span className="text-[10px] font-mono text-amber-500 block mt-2">Views + copies + likes</span>
            </div>
          </div>

          {/* Quick shortcut trigger cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-[#1E293B] border border-violet-500/10 space-y-4">
              <h3 className="font-bold text-white text-base font-sans">Administrative Checklists</h3>
              <ul className="text-xs text-gray-300 space-y-3 font-sans leading-relaxed">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real data sync operates over Supabase database tables securely</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No fake stats/Saas elements clutter the landing cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Duplicate prompts feature operates directly from the Prompt catalog tab</span>
                </li>
              </ul>
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setEditingPrompt({
                      id: undefined,
                      title: "",
                      description: "",
                      fullPrompt: "",
                      category: DEFAULT_CATEGORIES[0],
                      platform: SUPPORTED_PLATFORMS[0],
                      tags: [],
                      coverImage: "",
                      previewImages: [],
                      published: true,
                      featured: false
                    });
                    setActiveTab("prompts");
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Prompt
                </button>
                <button
                  onClick={() => {
                    setEditingWatchPrompt({
                      id: undefined,
                      title: "",
                      description: "",
                      videoUrl: "",
                      platform: SUPPORTED_PLATFORMS[0],
                      published: true
                    });
                    setActiveTab("watch_prompts");
                  }}
                  className="px-4 py-2 bg-[#06B6D4] hover:bg-[#06B6D4]/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Watch Prompt
                </button>
              </div>
            </div>

            {/* Quick stats distribution breakdown summary */}
            <div className="p-6 rounded-3xl bg-[#1E293B] border border-violet-500/10 space-y-4">
              <h3 className="font-bold text-white text-base font-sans">Recent Catalog Actions</h3>
              <div className="space-y-3 font-mono text-xs text-gray-400">
                {prompts.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-violet-500/5">
                    <span className="text-white truncate max-w-[60%]">{p.title}</span>
                    <span className="text-[10px] bg-[#1F2A44] text-cyan-300 px-2 py-0.5 rounded">
                      {p.platform}
                    </span>
                  </div>
                ))}
                {prompts.length === 0 && <p className="text-gray-500">No prompt entries yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODULE 2: MANAGE PROMPTS CATALOGUE (WITH DUPLICATE CONTROLS) --- */}
      {activeTab === "prompts" && (
        <div className="space-y-6 animate-fadeIn">
          {/* List display */}
          {!editingPrompt ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E293B] p-5 rounded-2xl border border-violet-500/10">
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-sans text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-violet-400" />
                    Active Prompt Catalog
                  </h3>
                  <p className="text-[11px] text-gray-400 font-sans">
                    Showing {prompts.length} entries &bull; Sorted locally in workspace
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#0F172A] border border-violet-500/10 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Sort By</span>
                    <select
                      value={promptSortBy}
                      onChange={(e) => setPromptSortBy(e.target.value as any)}
                      className="bg-transparent text-xs text-cyan-400 font-medium font-sans focus:outline-none cursor-pointer border-none p-0 pr-6"
                    >
                      <option value="createdAt-desc" className="bg-[#0F172A] text-white">Date Created (Newest)</option>
                      <option value="createdAt-asc" className="bg-[#0F172A] text-white">Date Created (Oldest)</option>
                      <option value="popularity-desc" className="bg-[#0F172A] text-white">Popularity (Most Viewed)</option>
                      <option value="popularity-asc" className="bg-[#0F172A] text-white">Popularity (Least Viewed)</option>
                      <option value="status-published" className="bg-[#0F172A] text-white">Status (Published First)</option>
                      <option value="status-draft" className="bg-[#0F172A] text-white">Status (Drafts First)</option>
                    </select>
                  </div>
                  
                  <button
                    id="admin-create-prompt-btn"
                    onClick={() =>
                      setEditingPrompt({
                        title: "",
                        description: "",
                        fullPrompt: "",
                        category: DEFAULT_CATEGORIES[0],
                        platform: SUPPORTED_PLATFORMS[0],
                        tags: [],
                        coverImage: "",
                        previewImages: [],
                        published: true
                      })
                    }
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Brand New Prompt
                  </button>
                </div>
              </div>

              {/* Prompt table */}
              <div className="overflow-x-auto bg-[#1F2A44] border border-violet-500/10 rounded-2xl">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-violet-500/15 bg-slate-900/40 text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">
                      <th className="p-4">Visual Cover</th>
                      <th className="p-4">Prompt Title</th>
                      <th className="p-4">Segment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-500/5 text-xs text-gray-300">
                    {sortedPrompts.map((p) => (
                      <tr key={p.id} className="hover:bg-violet-950/10 transition">
                        <td className="p-4 shrink-0">
                          <img
                            src={p.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100"}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-12 h-8 rounded-lg object-cover bg-[#0F172A]"
                          />
                        </td>
                        <td className="p-4 max-w-sm">
                          <span className="font-bold text-white block truncate">{p.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono italic">{p.platform} &bull; {p.id}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-gray-300">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4 font-mono">
                          {p.published === false ? (
                            <span className="text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded text-[10px]">Unpublished Draft</span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Live Storefront</span>
                          )}
                          {p.featured && (
                            <span className="ml-1 px-1.5 py-0.5 text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded text-[10px] inline-flex items-center gap-0.5 font-bold">
                              ★ Featured
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleDuplicatePrompt(p)}
                              className="p-1 px-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 transition"
                              title="Duplicate Prompt"
                            >
                              <Files className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPrompt(p)}
                              className="p-1 px-2 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 transition"
                              title="Edit Prompt"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: "prompt", id: p.id, title: p.title || "Untitled" })}
                              className="p-1 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition"
                              title="Delete Prompt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Editing prompt form */
            <div className="bg-[#1F2A44]/80 border border-violet-500/15 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
                <h3 className="font-sans font-bold text-lg text-white">
                  {editingPrompt.id ? `Modify: ${editingPrompt.title}` : "Create Brand New Prompt Entry"}
                </h3>
                <button
                  onClick={() => setEditingPrompt(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-xs font-mono text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSavePromptClick} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left panel edit */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                        Prompt Title Heading
                      </label>
                      <input
                        id="prompt-form-title"
                        type="text"
                        placeholder="e.g., Ultra Realistic Architecture Renderer v6"
                        value={editingPrompt.title || ""}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                        Tagline Description excerpt
                      </label>
                      <textarea
                        id="prompt-form-desc"
                        placeholder="Outline what output this prompt focuses on generating."
                        rows={2}
                        value={editingPrompt.description || ""}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                          Target Core Platform
                        </label>
                        <select
                          id="prompt-form-platform"
                          value={editingPrompt.platform || SUPPORTED_PLATFORMS[0]}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, platform: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 text-gray-300 rounded-xl px-3 py-2 text-xs"
                          required
                        >
                          {SUPPORTED_PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                          Category Classification
                        </label>
                        <select
                          id="prompt-form-category"
                          value={editingPrompt.category || DEFAULT_CATEGORIES[0]}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 text-gray-300 rounded-xl px-3 py-2 text-xs"
                        >
                          {DEFAULT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                        Cover Image thumbnail (URL input or Upload)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="prompt-form-cover"
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={editingPrompt.coverImage || ""}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, coverImage: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => coverFileRef.current?.click()}
                          className="px-4 py-2 bg-slate-900 border border-white/5 text-gray-300 rounded-xl text-xs flex items-center gap-1.5 hover:text-white"
                        >
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          Upload
                        </button>
                        <input
                          type="file"
                          ref={coverFileRef}
                          onChange={(e) => triggerMediaUpload(e, "cover")}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                        Video Demonstration URL (MP4 looping)
                      </label>
                      <input
                        id="prompt-form-video"
                        type="text"
                        placeholder="https://assets.mixkit.co/... .mp4"
                        value={editingPrompt.videoDemo || ""}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, videoDemo: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Right panel edit */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                        Full Instructions (Directions supplied to the prompt box)
                      </label>
                      <textarea
                        id="prompt-form-instructions"
                        placeholder="Paste complete directions here. Use [variables] inside brackets for adjustable fields."
                        rows={7}
                        value={editingPrompt.fullPrompt || ""}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, fullPrompt: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono leading-relaxed resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                        Search tags (separating words with commas)
                      </label>
                      <input
                        id="prompt-form-tags"
                        type="text"
                        placeholder="architectural, hyper-realistic, raytraced"
                        value={Array.isArray(editingPrompt.tags) ? editingPrompt.tags.join(", ") : ""}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, tags: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex gap-4 items-center bg-[#0F172A]/40 p-3 rounded-xl border border-violet-500/10">
                        <input
                          type="checkbox"
                          id="prompt-form-published"
                          checked={editingPrompt.published !== false}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, published: e.target.checked })}
                          className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="prompt-form-published" className="text-xs font-mono text-gray-300 cursor-pointer select-none">
                          Publish instantly (Live to catalog readers)
                        </label>
                      </div>

                      <div className="flex gap-4 items-center bg-[#0F172A]/40 p-3 rounded-xl border border-violet-500/10">
                        <input
                          type="checkbox"
                          id="prompt-form-featured"
                          checked={editingPrompt.featured === true}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, featured: e.target.checked })}
                          className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="prompt-form-featured" className="text-xs font-mono text-gray-300 cursor-pointer select-none">
                          Featured Prompt (Top of homepage)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadFeedback && (
                  <p className="text-xs text-cyan-300 bg-[#0F172A] p-2 rounded-lg border border-cyan-500/10 font-mono">
                    {uploadFeedback}
                  </p>
                )}

                <div className="pt-4 border-t border-violet-500/15 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPrompt(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-xs font-semibold text-gray-300 rounded-xl"
                  >
                    Discard
                  </button>

                  <button
                    id="save-prompt-submit-btn"
                    type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    {isSaving ? "Writing Record..." : saveSuccess ? "Completed!" : "Persist Prompt Asset"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- MODULE 3: MANAGE EDUCATIONAL GUIDES SECTION --- */}
      {activeTab === "guides" && (
        <div className="space-y-6 animate-fadeIn">
          {!editingGuide ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-sans text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-pink-400" />
                  Active Guide Book ({guides.length} Guides)
                </h3>
                <button
                  onClick={() =>
                    setEditingGuide({
                      title: "",
                      description: "",
                      content: "",
                      featuredImage: "",
                      video: "",
                      tags: [],
                      relatedPrompts: []
                    })
                  }
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Guide Article
                </button>
              </div>

              {/* Guide table */}
              <div className="overflow-x-auto bg-[#1F2A44] border border-violet-500/10 rounded-2xl">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-violet-500/15 bg-slate-900/40 text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">
                      <th className="p-4">Visual Cover</th>
                      <th className="p-4">Tutorial Header</th>
                      <th className="p-4">Views logged</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-500/5 text-xs text-gray-300">
                    {guides.map((g) => (
                      <tr key={g.id} className="hover:bg-violet-950/10 transition">
                        <td className="p-4 shrink-0">
                          <img
                            src={g.featuredImage || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=100"}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-12 h-8 rounded-lg object-cover bg-slate-900"
                          />
                        </td>
                        <td className="p-4 max-w-sm">
                          <span className="font-bold text-white block truncate">{g.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono italic">{g.id}</span>
                        </td>
                        <td className="p-4 font-mono">{g.views || 0} views</td>
                        <td className="p-4 text-right transform">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setEditingGuide(g)}
                              className="p-1 px-2 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: "guide", id: g.id, title: g.title || "Untitled" })}
                              className="p-1 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#1F2A44]/80 border border-violet-500/15 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
                <h3 className="font-sans font-bold text-lg text-white">
                  {editingGuide.id ? `Modify Guide: ${editingGuide.title}` : "Create Guide Guide Tutorial"}
                </h3>
                <button
                  onClick={() => setEditingGuide(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-xs font-mono text-gray-400"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveGuideClick} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Guide Title
                      </label>
                      <input
                        id="guide-form-title"
                        type="text"
                        placeholder="e.g., The Ultimate Guide to Gemini API Prompts"
                        value={editingGuide.title || ""}
                        onChange={(e) => setEditingGuide({ ...editingGuide, title: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Brief Excerpt Tagline
                      </label>
                      <textarea
                        id="guide-form-desc"
                        rows={3}
                        value={editingGuide.description || ""}
                        onChange={(e) => setEditingGuide({ ...editingGuide, description: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Featured Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="guide-form-image"
                          type="text"
                          value={editingGuide.featuredImage || ""}
                          onChange={(e) => setEditingGuide({ ...editingGuide, featuredImage: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => guideFeaturedRef.current?.click()}
                          className="px-4 py-2 bg-slate-900 border border-white/5 text-gray-300 rounded-xl text-xs flex items-center gap-1"
                        >
                          Upload
                        </button>
                        <input
                          type="file"
                          ref={guideFeaturedRef}
                          onChange={(e) => triggerMediaUpload(e, "guideFeatured")}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Content (Markdown supported)
                      </label>
                      <textarea
                        id="guide-form-content"
                        rows={8}
                        value={editingGuide.content || ""}
                        onChange={(e) => setEditingGuide({ ...editingGuide, content: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono leading-relaxed"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                          Tags (comma separated)
                        </label>
                        <input
                          id="guide-form-tags"
                          type="text"
                          value={Array.isArray(editingGuide.tags) ? editingGuide.tags.join(", ") : ""}
                          onChange={(e) => setEditingGuide({ ...editingGuide, tags: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                          Related Prompt IDs
                        </label>
                        <input
                          id="guide-form-related"
                          type="text"
                          value={Array.isArray(editingGuide.relatedPrompts) ? editingGuide.relatedPrompts.join(", ") : ""}
                          onChange={(e) => setEditingGuide({ ...editingGuide, relatedPrompts: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-violet-500/15 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingGuide(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-xs text-gray-300 rounded-xl"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Save Guide Entry
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- MODULE 4: DYNAMIC WATCH PROMPTS CMS MANAGER --- */}
      {activeTab === "watch_prompts" && (
        <div className="space-y-6 animate-fadeIn">
          {!editingWatchPrompt ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-sans text-white uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4.5 h-4.5 text-amber-500" />
                  Dynamic Watch Prompt System clips ({watchPrompts.length})
                </h3>
                <button
                  onClick={() =>
                    setEditingWatchPrompt({
                      title: "",
                      description: "",
                      videoUrl: "",
                      platform: SUPPORTED_PLATFORMS[0],
                      published: true
                    })
                  }
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  Publish Video Demo Clip
                </button>
              </div>

              {/* Watch prompts list table */}
              <div className="overflow-x-auto bg-[#1F2A44] border border-violet-500/10 rounded-2xl">
                <table className="w-full text-left font-sans text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-violet-500/15 bg-slate-900/40 text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">
                      <th className="p-4">Thumbnail</th>
                      <th className="p-4">Watch Title</th>
                      <th className="p-4">Platform</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-500/5 text-xs text-gray-300">
                    {watchPrompts.map((wp) => (
                      <tr key={wp.id} className="hover:bg-violet-950/10 transition">
                        <td className="p-4 shrink-0">
                          <img
                            src={wp.thumbnailUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=100"}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-12 h-8 rounded-lg object-cover bg-slate-900"
                          />
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-white block">{wp.title}</span>
                          <span className="text-[10px] text-cyan-400 block truncate max-w-xs">{wp.videoUrl}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#0F172A] text-cyan-400 font-bold">
                            {wp.platform}
                          </span>
                        </td>
                        <td className="p-4 font-mono">
                          {wp.published === false ? (
                            <span className="text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded text-[10px]">Draft</span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded text-[10px]">Live</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setEditingWatchPrompt(wp)}
                              className="p-1 px-2.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: "watch_prompt", id: wp.id, title: wp.title || "Untitled" })}
                              className="p-1 px-2.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#1F2A44]/80 border border-violet-500/15 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
                <h3 className="font-sans font-bold text-lg text-white">
                  {editingWatchPrompt.id ? `Modify Video: ${editingWatchPrompt.title}` : "Upload Watch Prompt Video Demo"}
                </h3>
                <button
                  onClick={() => setEditingWatchPrompt(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-xs font-mono text-gray-400"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveWatchPromptClick} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Video Showcase Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Create Hyperdetailed Isometric Art via Midjourney"
                        value={editingWatchPrompt.title || ""}
                        onChange={(e) => setEditingWatchPrompt({ ...editingWatchPrompt, title: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        YouTube / YouTube Shorts Link
                      </label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        value={editingWatchPrompt.videoUrl || ""}
                        onChange={(e) => setEditingWatchPrompt({ ...editingWatchPrompt, videoUrl: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                        required
                      />
                      <span className="text-[10px] font-mono text-cyan-400 block mt-1.5">
                        YouTube video identifiers are decoded, thumbnail images are resolved automatically
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                        Short text outline
                      </label>
                      <textarea
                        placeholder="Outline the steps that this clip explains..."
                        rows={3}
                        value={editingWatchPrompt.description || ""}
                        onChange={(e) => setEditingWatchPrompt({ ...editingWatchPrompt, description: e.target.value })}
                        className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                          Target Platform
                        </label>
                        <select
                          value={editingWatchPrompt.platform || SUPPORTED_PLATFORMS[0]}
                          onChange={(e) => setEditingWatchPrompt({ ...editingWatchPrompt, platform: e.target.value })}
                          className="w-full bg-[#0F172A] border border-violet-500/20 text-gray-300 rounded-xl px-3 py-2 text-xs"
                          required
                        >
                          {SUPPORTED_PLATFORMS.map((plat) => (
                            <option key={plat} value={plat}>{plat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 items-center bg-[#0F172A]/40 px-3 py-2.5 rounded-xl border border-violet-500/10 mt-5">
                        <input
                          type="checkbox"
                          id="watch-prompt-published"
                          checked={editingWatchPrompt.published !== false}
                          onChange={(e) => setEditingWatchPrompt({ ...editingWatchPrompt, published: e.target.checked })}
                          className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                        />
                        <label htmlFor="watch-prompt-published" className="text-xs font-mono text-gray-300 cursor-pointer select-none">
                          Published
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-violet-500/15 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingWatchPrompt(null)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-xs text-gray-300 rounded-xl"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Add Live Video Clip
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- MODULE 5: MEDIA STORAGE LIBRARY --- */}
      {activeTab === "media" && (
        <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/15 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
            <div>
              <h3 className="font-bold text-white text-base">Media Library Asset Storage</h3>
              <p className="text-xs text-gray-400 mt-1 font-mono">Upload, store, and recall images/videos to reuse in guides and prompt covers.</p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => mediaUploaderRef.current?.click()}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" /> Upload Asset File
              </button>
              <input
                type="file"
                ref={mediaUploaderRef}
                onChange={(e) => triggerMediaUpload(e, "mediaLibrary")}
                className="hidden"
                accept="image/*,video/*,image/gif"
              />
            </div>
          </div>

          {/* Quick Upload Drag & Drop Area */}
          <div
            onClick={() => mediaUploaderRef.current?.click()}
            className="border-2 border-dashed border-violet-500/20 hover:border-cyan-500/40 hover:bg-[#0F172A]/40 transition rounded-2xl p-8 text-center cursor-pointer"
          >
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-bounce" />
            <span className="font-sans font-semibold text-xs text-white block">Drag files here, or click to browse</span>
            <span className="text-[10px] font-mono text-gray-500 mt-1.5 block">Supports PNG, JPEG, GIF, MP4, WebM (Max size: 50MB)</span>
          </div>

          {uploadFeedback && (
            <p className="text-xs font-mono text-cyan-400 bg-cyan-950/20 py-2 px-3 rounded-lg border border-cyan-500/20">
              {uploadFeedback}
            </p>
          )}

          {/* Assets Grid */}
          <div className="space-y-3">
            <h4 className="font-mono text-[10px] uppercase text-gray-400 tracking-wider">Asset Catalog grid</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedMediaList.map((url, index) => {
                const basename = url.split("/").pop() || `Media Asset ${index + 1}`;
                return (
                  <div
                    key={index}
                    className="relative group aspect-square bg-[#0F172A] border border-violet-500/10 rounded-xl overflow-hidden shadow-md flex flex-col justify-between p-2"
                  >
                    <img
                      src={url}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-[70%] object-cover rounded-lg bg-slate-950"
                      onError={(e) => {
                        // generic video/asset fallback icon
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition duration-200">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          alert("Media URL path copied to clipboard!");
                        }}
                        className="px-3 py-1.5 bg-[#7C3AED] text-white rounded text-[10px] font-mono tracking-wide font-bold"
                      >
                        Copy URL Path
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 block truncate text-center mt-1">
                      {basename}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- MODULE 6: CLASSIFICATION CATEGORIES MATRIX --- */}
      {activeTab === "categories" && (
        <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/15 space-y-6 animate-fadeIn">
          <div>
            <h3 className="font-bold text-white text-base">Category Matrix Audit</h3>
            <p className="text-xs text-gray-400 font-mono mt-1">View active classifications and live tag counts compiled from the Supabase model tables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category breakdown counts */}
            <div className="space-y-4">
              <h4 className="font-semibold text-xs text-white uppercase font-mono tracking-wider flex items-center gap-2 text-cyan-400">
                <FolderOpen className="w-4 h-4" /> Categories count breakdown
              </h4>
              <div className="space-y-2 font-sans text-xs">
                {DEFAULT_CATEGORIES.map((category) => {
                  const count = prompts.filter((p) => p.category === category).length;
                  const ratio = Math.round((count / Math.max(prompts.length, 1)) * 100);
                  return (
                    <div key={category} className="bg-[#0F172A] p-3 rounded-xl border border-violet-500/5 flex justify-between items-center">
                      <span className="text-white font-semibold">{category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-mono">{count} prompts</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-[#1F2A44] px-1.5 py-0.5 rounded">{ratio}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compiled keyword tag matrix lists */}
            <div className="space-y-4">
              <h4 className="font-semibold text-xs text-white uppercase font-mono tracking-wider flex items-center gap-2 text-violet-400">
                <Tag className="w-4 h-4" /> Compiled active keyword tag registers
              </h4>
              <div className="p-4 rounded-xl bg-[#0F172A] border border-violet-500/5 min-h-[300px]">
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(prompts.flatMap((p) => p.tags || [])))
                    .filter((t) => t.trim().length > 0)
                    .map((tag) => {
                      const frequency = prompts.filter((p) => p.tags?.includes(tag)).length;
                      return (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded bg-[#1F2A44] border border-violet-500/10 text-[10px] font-mono text-gray-300 hover:text-white transition duration-200"
                        >
                          #{tag} ({frequency})
                        </span>
                      );
                    })}
                  {prompts.flatMap((p) => p.tags || []).length === 0 && (
                    <p className="text-gray-500 text-xs italic font-mono p-4">No active keywords tagged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODULE 7: PLATFORM PERFORMANCE ANALYTICS (REAL UNIQUE DATA) --- */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Real stats summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Views logged</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{totalViews.toLocaleString()}</span>
            </div>
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total copies logged</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{totalCopies.toLocaleString()}</span>
            </div>
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-violet-500/10">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Favorites Favorited</span>
              <span className="text-3xl font-extrabold text-white block mt-1">{totalLikes.toLocaleString()}</span>
            </div>
            <div className="p-6 rounded-2xl bg-[#1F2A44] border border-[#7C3AED]/20">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">Conversion Factor</span>
              <span className="text-3xl font-extrabold text-[#7C3AED] block mt-1">
                {totalViews > 0 ? ((totalCopies / totalViews) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Viewed Prompts list */}
            <div className="p-6 rounded-2xl bg-[#1F2A44]/60 border border-violet-500/10 space-y-4">
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Rating performance: Most Viewed Prompts
              </h3>
              <div className="space-y-4 font-sans text-xs">
                {prompts
                  .slice()
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 4)
                  .map((p, idx) => {
                    const maxVal = Math.max(...prompts.map((pm) => pm.views || 1));
                    const ratio = Math.ceil(((p.views || 0) / maxVal) * 100);
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex justify-between items-center text-gray-300">
                          <span className="font-semibold text-white truncate max-w-[80%]">
                            {idx + 1}. {p.title}
                          </span>
                          <span className="font-mono text-cyan-400 font-bold shrink-0">
                            {p.views} views
                          </span>
                        </div>
                        <div className="w-full bg-[#0F172A] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-violet-500 h-1.5 rounded-full animate-pulse"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top Copied Prompts list */}
            <div className="p-6 rounded-2xl bg-[#1F2A44]/60 border border-violet-500/10 space-y-4">
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
                <CopyCheck className="w-4 h-4 text-cyan-400" />
                Conversion performance: Most Copied Prompts
              </h3>
              <div className="space-y-4 font-sans text-xs">
                {prompts
                  .slice()
                  .sort((a, b) => b.copyCount - a.copyCount)
                  .slice(0, 4)
                  .map((p, idx) => {
                    const maxVal = Math.max(...prompts.map((pm) => pm.copyCount || 1));
                    const ratio = Math.ceil(((p.copyCount || 0) / maxVal) * 100);
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex justify-between items-center text-gray-300">
                          <span className="font-semibold text-white truncate max-w-[80%]">
                            {idx + 1}. {p.title}
                          </span>
                          <span className="font-mono text-cyan-400 font-bold shrink-0">
                            {p.copyCount} copies
                          </span>
                        </div>
                        <div className="w-full bg-[#0F172A] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-cyan-400 h-1.5 rounded-full animate-pulse"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODULE 8: SYSTEM SETTINGS AND CONFIGURATIONS (WITH SUPABASE DETAILS) --- */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
          {/* SEO & Configurations */}
          <div className="p-6 rounded-2xl bg-[#1F2A44]/80 border border-violet-500/15 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold font-sans text-white uppercase font-mono tracking-widest text-[#7C3AED] flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              Storefront SEO Metadata & Identity
            </h3>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                Branding Logo Name
              </label>
              <input
                id="setting-logo-name"
                type="text"
                value={logoName}
                onChange={(e) => setLogoName(e.target.value)}
                className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                SEO Page Meta Title
              </label>
              <input
                id="setting-seo-title"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                SEO Page Meta Description
              </label>
              <textarea
                id="setting-seo-desc"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white resize-none"
              />
            </div>

            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-wide block">
                Social Links & Support configuration
              </span>
              <div className="grid grid-cols-1 gap-3.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-mono uppercase font-medium">Twitter URL</label>
                  <input
                    type="text"
                    placeholder="Twitter Link..."
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-mono uppercase font-medium">YouTube URL</label>
                  <input
                    type="text"
                    placeholder="YouTube Link..."
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                    className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-mono uppercase font-medium">Instagram URL</label>
                  <input
                    type="text"
                    placeholder="Instagram Link..."
                    value={socialInstagram || ""}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-mono uppercase font-medium">Facebook URL</label>
                  <input
                    type="text"
                    placeholder="Facebook Link..."
                    value={socialFacebook || ""}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-mono uppercase font-medium">Contact Us Support Email</label>
                  <input
                    type="email"
                    placeholder="shubhprompt@gmail.com"
                    value={contactEmail || ""}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white text-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-mono uppercase font-medium">Administrator Email ID</label>
                  <input
                    type="email"
                    placeholder="admin@shubhprompt.online"
                    value={adminEmail || ""}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white text-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Access security change */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#1F2A44]/80 border border-violet-500/15 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold font-sans text-white uppercase font-mono tracking-widest text-rose-500 flex items-center gap-2">
                <Power className="w-4 h-4" />
                Console Access Password Code
              </h3>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Alter the administrative access passkey. Ensure you write down the new value to keep console access secure.
              </p>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                  New Admin Password
                </label>
                <input
                  id="setting-new-passwd"
                  type="password"
                  placeholder="Enter custom password..."
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full bg-[#0F172A] border border-violet-500/20 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Supabase Schema Helper Block */}
            {settings.supabaseUrl && (
              <div className="p-6 rounded-2xl bg-[#1F2A44]/80 border border-violet-500/15 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold font-sans text-white uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Live Connection Info
                </h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  To stream live prompt additions, views, or copies directly from your project cloud instance, copy and run this DDL script in your Supabase project's SQL Editor.
                </p>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[9px] text-gray-400 mb-0.5 font-mono uppercase">Connected Project Host</label>
                    <input
                      type="text"
                      readOnly
                      value={settings.supabaseUrl}
                      className="w-full bg-[#0F172A]/50 border border-violet-500/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-400 mb-0.5 font-mono uppercase">API Anon Public Code</label>
                    <input
                      type="text"
                      readOnly
                      value={settings.supabaseAnonKey ? settings.supabaseAnonKey.substring(0, 18) + "..." + settings.supabaseAnonKey.substring(settings.supabaseAnonKey.length - 8) : "Configured"}
                      className="w-full bg-[#0F172A]/50 border border-violet-500/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-violet-500/10 pt-4 space-y-2">
                  <span className="block text-[10px] font-mono uppercase font-bold text-gray-300">Database Schema Bootstrap SQL</span>
                  <div className="relative">
                    <pre className="w-full h-32 overflow-y-auto bg-[#0F172A] border border-violet-500/20 rounded-xl p-3 text-[10px] text-emerald-400/95 font-mono leading-normal whitespace-pre scrollbar-thin select-all">
{`-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    config JSONB DEFAULT '{}'::jsonb
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    "fullPrompt" TEXT,
    category TEXT,
    platform TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    "coverImage" TEXT,
    "previewImages" JSONB DEFAULT '[]'::jsonb,
    animation TEXT,
    "videoDemo" TEXT,
    "createdAt" TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    "copyCount" INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false
);

-- Create guides table
CREATE TABLE IF NOT EXISTS guides (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    content TEXT,
    "featuredImage" TEXT,
    video TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    "relatedPrompts" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TEXT,
    views INTEGER DEFAULT 0
);

-- Create watch_prompts table
CREATE TABLE IF NOT EXISTS watch_prompts (
    id TEXT PRIMARY KEY,
    title TEXT,
    "coverUrl" TEXT,
    "videoUrl" TEXT,
    "ytVideoId" TEXT,
    "fullPrompt" TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    views INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    "createdAt" TEXT
);

-- Enable RLS & add policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read access" ON prompts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON prompts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read access" ON guides FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON guides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read access" ON watch_prompts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON watch_prompts FOR ALL USING (true) WITH CHECK (true);`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        const sqlText = `-- Create settings table\nCREATE TABLE IF NOT EXISTS settings (\n    id TEXT PRIMARY KEY,\n    config JSONB DEFAULT '{}'::jsonb\n);\n\n-- Create prompts table\nCREATE TABLE IF NOT EXISTS prompts (\n    id TEXT PRIMARY KEY,\n    title TEXT,\n    description TEXT,\n    "fullPrompt" TEXT,\n    category TEXT,\n    platform TEXT,\n    tags JSONB DEFAULT '[]'::jsonb,\n    "coverImage" TEXT,\n    "previewImages" JSONB DEFAULT '[]'::jsonb,\n    animation TEXT,\n    "videoDemo" TEXT,\n    "createdAt" TEXT,\n    views INTEGER DEFAULT 0,\n    likes INTEGER DEFAULT 0,\n    shares INTEGER DEFAULT 0,\n    "copyCount" INTEGER DEFAULT 0,\n    published BOOLEAN DEFAULT true,\n    featured BOOLEAN DEFAULT false\n);\n\n-- Create guides table\nCREATE TABLE IF NOT EXISTS guides (\n    id TEXT PRIMARY KEY,\n    title TEXT,\n    description TEXT,\n    content TEXT,\n    "featuredImage" TEXT,\n    video TEXT,\n    tags JSONB DEFAULT '[]'::jsonb,\n    "relatedPrompts" JSONB DEFAULT '[]'::jsonb,\n    "createdAt" TEXT,\n    views INTEGER DEFAULT 0\n);\n\n-- Create watch_prompts table\nCREATE TABLE IF NOT EXISTS watch_prompts (\n    id TEXT PRIMARY KEY,\n    title TEXT,\n    "coverUrl" TEXT,\n    "videoUrl" TEXT,\n    "ytVideoId" TEXT,\n    "fullPrompt" TEXT,\n    tags JSONB DEFAULT '[]'::jsonb,\n    category TEXT,\n    views INTEGER DEFAULT 0,\n    published BOOLEAN DEFAULT true,\n    "createdAt" TEXT\n);\n\n-- Enable RLS & add policies\nALTER TABLE settings ENABLE ROW LEVEL SECURITY;\nALTER TABLE prompts ENABLE ROW LEVEL SECURITY;\nALTER TABLE guides ENABLE ROW LEVEL SECURITY;\nALTER TABLE watch_prompts ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Allow anonymous read access" ON settings FOR SELECT USING (true);\nCREATE POLICY "Allow anonymous write access" ON settings FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Allow anonymous read access" ON prompts FOR SELECT USING (true);\nCREATE POLICY "Allow anonymous write access" ON prompts FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Allow anonymous read access" ON guides FOR SELECT USING (true);\nCREATE POLICY "Allow anonymous write access" ON guides FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Allow anonymous read access" ON watch_prompts FOR SELECT USING (true);\nCREATE POLICY "Allow anonymous write access" ON watch_prompts FOR ALL USING (true) WITH CHECK (true);`;
                        navigator.clipboard.writeText(sqlText);
                        alert("SQL Schema copied to clipboard!");
                      }}
                      className="absolute btn-copy top-2 right-2 p-1.5 rounded-lg bg-[#1F2A44] border border-violet-500/20 text-gray-400 hover:text-white transition duration-200 cursor-pointer"
                      title="Copy SQL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Direct update triggering buttons */}
            <div className="flex flex-col gap-3">
              <button
                id="save-settings-btn"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-4.5 bg-[#7C3AED] hover:bg-[#6c30db] disabled:opacity-50 text-white font-sans text-sm font-bold rounded-2xl transition duration-300 shadow-[0_10px_30px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-cyan-200" />
                    Committing Changes...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4.5 h-4.5" />
                    Configuration Persisted Successfully!
                  </>
                ) : (
                  "Persist Platform Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
