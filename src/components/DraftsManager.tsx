import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Wand2, 
  Eye, 
  Loader2, 
  Calendar, 
  Check,
  Plus,
  RefreshCw,
  Folder,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Copy,
  Info
} from "lucide-react";
import { 
  fetchAllDrafts, 
  createDraft, 
  updateDraft, 
  deleteDraft 
} from "../lib/firebaseDrafts";
import { PromptDraft, Prompt } from "../types";

const CATEGORIES = [
  "Text Generation",
  "Image Generation",
  "Video Generation",
  "Software Engineering",
  "Marketing & Copywriting",
  "Web Search & Research",
  "Audio & Music Workflows",
  "Data Analysis"
];

interface DraftsManagerProps {
  onSavePrompt: (prompt: Partial<Prompt>) => Promise<boolean>;
  onUploadMedia?: (file: File) => Promise<string | null>;
  token: string | null;
}

export default function DraftsManager({ onSavePrompt, onUploadMedia, token }: DraftsManagerProps) {
  // Lists & UI states
  const [drafts, setDrafts] = useState<PromptDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "rejected">("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Generator pane states
  const [generatorTopic, setGeneratorTopic] = useState("");
  const [generatorCategory, setGeneratorCategory] = useState("Text Generation");
  const [generating, setGenerating] = useState(false);

  // Generator Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [modalTopic, setModalTopic] = useState("");
  const [modalCategory, setModalCategory] = useState("Text Generation");
  const [modalNumPrompts, setModalNumPrompts] = useState(1);
  const [modalGenerating, setModalGenerating] = useState(false);
  const [modalProgressStatus, setModalProgressStatus] = useState("");
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Selection states
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);

  // Telemetry, Trends & Alert notification states
  const [activeSubTab, setActiveSubTab] = useState<"factory" | "trends" | "logs">("factory");
  const [trendsList, setTrendsList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [curatingTrends, setCuratingTrends] = useState(false);
  const [triggeringScheduler, setTriggeringScheduler] = useState(false);
  
  // AI Factory state
  const [factoryBatchTopic, setFactoryBatchTopic] = useState("");
  const [factoryBatchCategory, setFactoryBatchCategory] = useState("Text Generation");
  const [factoryBatchSize, setFactoryBatchSize] = useState(10);
  const [factoryGenerating, setFactoryGenerating] = useState(false);

  // Focus/Editor/Preview states
  const [editingDraft, setEditingDraft] = useState<Partial<PromptDraft> | null>(null);
  const [previewingDraft, setPreviewingDraft] = useState<PromptDraft | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Initialize draft listings and notifications queue
  useEffect(() => {
    loadDrafts();
    if (token) {
      loadTrends();
      loadLogs();
      loadNotifications();
    }
  }, [token]);

  // Load trends
  async function loadTrends() {
    try {
      const response = await fetch(`/api/trends?token=${token}`);
      if (response.ok) {
        setTrendsList(await response.json());
      }
    } catch (err) {
      console.error("Could not fetch trends:", err);
    }
  }

  // Load telemetry logs
  async function loadLogs() {
    try {
      const response = await fetch(`/api/admin/logs?token=${token}`);
      if (response.ok) {
        setLogsList(await response.json());
      }
    } catch (err) {
      console.error("Could not fetch telemetry logs:", err);
    }
  }

  // Load alert notifications
  async function loadNotifications() {
    try {
      const response = await fetch(`/api/admin/notifications?token=${token}`);
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (err) {
      console.error("Could not fetch alerts:", err);
    }
  }

  // Clear notify lists
  async function dismissNotifications() {
    setNotifications([]);
    try {
      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
    } catch (err) {
      console.error("Could not dismiss", err);
    }
  }

  // Force curating new trending topics
  async function handleCurateTrends() {
    setCuratingTrends(true);
    setSuccessNotification(null);
    setError(null);
    try {
      const response = await fetch("/api/trends/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setSuccessNotification(`Trending topics calculated successfully! Scanned: ${data.scanned}, Newly Saved: ${data.saved} topics.`);
      await loadTrends();
    } catch (err: any) {
      setError(err.message || "Failed to trigger dynamic trends analytics discovery.");
    } finally {
      setCuratingTrends(false);
    }
  }

  // Force immediate execution of the full 6-hour scheduler pipeline
  async function handleTriggerScheduler() {
    setTriggeringScheduler(true);
    setSuccessNotification(null);
    setError(null);
    try {
      const response = await fetch("/api/scheduler/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (!response.ok) throw new Error(await response.text());
      const resData = await response.json();
      setSuccessNotification(
        `Automated Scheduler workflow executed successfully! Scanned ${resData.scannedTrendsCount} topics, curations completed: ${resData.promptsFormulated}. Check matching notifications!`
      );
      await loadDrafts();
      await loadTrends();
      await loadLogs();
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || "Scheduler pipeline execution failed.");
    } finally {
      setTriggeringScheduler(false);
    }
  }

  // Launch AI Content Factory bulk queue sequence
  async function handleFactoryBatchGenerate() {
    setFactoryGenerating(true);
    setSuccessNotification(null);
    setError(null);
    try {
      const response = await fetch("/api/factory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          batchSize: factoryBatchSize,
          topic: factoryBatchTopic,
          category: factoryBatchCategory
        })
      });
      if (!response.ok) throw new Error(await response.text());
      setSuccessNotification(`Prompt Factory synthesized and registered ${factoryBatchSize} premium templates inside drafts queue!`);
      setFactoryBatchTopic("");
      await loadDrafts();
      await loadLogs();
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || "Batch factory generation sequence halted.");
    } finally {
      setFactoryGenerating(false);
    }
  }

  // Checkbox toggle actions
  function toggleSelectDraft(id: string) {
    setSelectedDraftIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleAllDrafts(pageItems: PromptDraft[]) {
    const pageIds = pageItems.map(d => d.id).filter((id): id is string => !!id);
    const allSelectedOnPage = pageIds.every(id => selectedDraftIds.includes(id));
    
    if (allSelectedOnPage) {
      setSelectedDraftIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedDraftIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  }

  // Bulk operation triggers
  async function handleBulkAction(action: "publish" | "reject" | "delete") {
    if (selectedDraftIds.length === 0) return;
    if (action === "delete" && !confirm("Are you sure you want to delete these drafts?")) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bulk-${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ids: selectedDraftIds })
      });
      if (!response.ok) throw new Error(await response.text());
      setSelectedDraftIds([]);
      setSuccessNotification(`Bulk action '${action}' applied successfully to the selected batch!`);
      await loadDrafts();
    } catch (err: any) {
      setError(err.message || `Bulk execution failed.`);
    } finally {
      setLoading(false);
    }
  }

  // Reset pagination to first page when search terms or filters alter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  async function loadDrafts() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllDrafts();
      setDrafts(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to sync drafts collection from Firestore. Ensure security rules permit operations.");
    } finally {
      setLoading(false);
    }
  }

  // Generate dynamic draft parameters calling the Gemini API proxy
  async function triggerAIGenerate() {
    if (!generatorTopic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/drafts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: generatorTopic, category: generatorCategory })
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Internal Gemini Error occurred.");
      }

      const generatedData: PromptDraft = await response.json();
      
      // Auto-focus the generated draft inside the edit frame so admin can examine/save
      setEditingDraft({
        ...generatedData,
        status: "draft"
      });
      setGeneratorTopic("");
      await loadDrafts(); // Sync the drafts list immediately with Firestore
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to trigger AI Draft model pipeline.");
    } finally {
      setGenerating(false);
    }
  }

  // Programmatic Batch AI Prompt generation matching user request
  async function handleModalGenerate() {
    if (!modalTopic.trim()) return;
    setModalGenerating(true);
    setSuccessNotification(null);
    setError(null);
    try {
      const numToGenerate = Math.max(1, Math.min(10, modalNumPrompts));
      
      for (let i = 0; i < numToGenerate; i++) {
        setModalProgressStatus(`Synthesizing prompt formula ${i + 1} of ${numToGenerate} with Gemini AI...`);
        
        const response = await fetch("/api/drafts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: modalTopic, category: modalCategory })
        });

        if (!response.ok) {
          throw new Error(await response.text() || `Failed to generate prompt #${i + 1}`);
        }
      }

      setSuccessNotification(
        `Successfully generated and registered ${numToGenerate} AI prompt draft(s) for "${modalTopic}"! Each has been saved to Firestore with status 'draft'.`
      );
      
      // Automatically refresh Draft list
      await loadDrafts();
      
      // Close modal and reset state
      setIsGenerateModalOpen(false);
      setModalTopic("");
      setModalCategory("Text Generation");
      setModalNumPrompts(1);

      // Dismiss notification after a delay
      setTimeout(() => {
        setSuccessNotification(null);
      }, 7000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during AI prompt drafting pipeline execution.");
    } finally {
      setModalGenerating(false);
      setModalProgressStatus("");
    }
  }

  // Standard File Upload wrapper
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadMedia) return;

    setImageUploading(true);
    try {
      const url = await onUploadMedia(file);
      if (url && editingDraft) {
        setEditingDraft(prev => prev ? { ...prev, imageUrl: url } : null);
      }
    } catch (err) {
      console.error(err);
      alert("Media upload failed.");
    } finally {
      setImageUploading(false);
    }
  }

  // Save changes locally to Firestore "prompt_drafts"
  async function handleSaveToFirestore() {
    if (!editingDraft || !editingDraft.title || !editingDraft.prompt) {
      alert("Draft must contain a title and a prompt body!");
      return;
    }

    setSavingProgress(true);
    try {
      const payload: Omit<PromptDraft, "id"> = {
        title: editingDraft.title || "",
        slug: editingDraft.slug || editingDraft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        prompt: editingDraft.prompt || "",
        description: editingDraft.description || "",
        blog: editingDraft.blog || "",
        seoTitle: editingDraft.seoTitle || "",
        seoDescription: editingDraft.seoDescription || "",
        keywords: editingDraft.keywords || "",
        category: editingDraft.category || "Text Generation",
        thumbnailPrompt: editingDraft.thumbnailPrompt || "",
        imagePrompt: editingDraft.imagePrompt || "",
        imageUrl: editingDraft.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
        trendScore: Number(editingDraft.trendScore || 90),
        qualityScore: Number(editingDraft.qualityScore || 90),
        status: editingDraft.status || "draft",
        createdAt: editingDraft.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: editingDraft.publishedAt || null
      };

      if (editingDraft.id) {
        await updateDraft(editingDraft.id, payload);
      } else {
        await createDraft(payload);
      }

      setEditingDraft(null);
      await loadDrafts();
    } catch (err) {
      console.error(err);
      alert("Error saving draft document.");
    } finally {
      setSavingProgress(false);
    }
  }

  // Approve and publish a draft directly into public display list
  async function handleApproveAndPublish(draft: PromptDraft) {
    if (!confirm(`Are you sure you want to approve and publish "${draft.title}"? This sets status to published and registers the publication server Timestamp.`)) {
      return;
    }

    setLoading(true);
    try {
      // 1. Update the status inside the drafts collection to published utilizing core serverTimestamp handler
      await updateDraft(draft.id!, {
        status: "published"
      });

      // 2. Synthesize/upsert standard Prompt configuration so that it populates the main catalog perfectly
      const cleanSlug = draft.slug || draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const mappedPrompt: Partial<Prompt> = {
        id: cleanSlug,
        title: draft.title,
        description: draft.description,
        fullPrompt: draft.prompt,
        category: draft.category || "Text Generation",
        platform: "Gemini", 
        tags: draft.keywords ? draft.keywords.split(",").map(k => k.trim()).filter(Boolean) : [],
        coverImage: draft.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
        previewImages: draft.imageUrl ? [draft.imageUrl] : [],
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        shares: 0,
        copyCount: 0,
        published: true,
        featured: true,
        
        // Dynamic alternate fields for perfect legacy compatibility
        tagline: draft.description,
        raw_prompt: draft.prompt,
        engine_category: draft.category || "Text Generation",
        classification: "Premium AI Formula",
        search_tags: draft.keywords ? draft.keywords.split(",").map(k => k.trim()).filter(Boolean) : [],
        image_url: draft.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
        total_views: 0,
        total_likes: 0,
        total_shares: 0
      };

      await onSavePrompt(mappedPrompt);
      await loadDrafts();
    } catch (err: any) {
      console.error(err);
      alert("Trouble approving and routing prompt to storefront cache.");
    } finally {
      setLoading(false);
    }
  }

  // Reject a draft (hides from public options)
  async function handleRejectDraft(draft: PromptDraft) {
    if (!confirm(`Reject draft "${draft.title}"? This marks its status to "rejected" immediately.`)) return;
    setLoading(true);
    try {
      await updateDraft(draft.id!, { status: "rejected" });
      await loadDrafts();
    } catch (err) {
      console.error(err);
      alert("Could not reject draft.");
    } finally {
      setLoading(false);
    }
  }

  // Delete draft document
  async function handleDeleteDraft(draft: PromptDraft) {
    if (!confirm(`Permanently delete the draft "${draft.title}"?`)) return;
    setLoading(true);
    try {
      await deleteDraft(draft.id!);
      await loadDrafts();
    } catch (err) {
      console.error(err);
      alert("Could not complete deletion.");
    } finally {
      setLoading(false);
    }
  }

  const filteredDrafts = drafts.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "all" ? true : d.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate Paginated outputs
  const totalItems = filteredDrafts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDrafts = filteredDrafts.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 font-sans text-gray-200" id="admin_drafts_pipeline">
      
      {/* Header and overview block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-violet-500/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Draft Management Suite</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Build, review, search and paginated manage AI prompts. Instantly publish prompts directly to the main catalog using Firestore.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer hover:shadow-cyan-800/25 border-none"
          >
            <Sparkles className="w-4 h-4" /> Generate AI Prompt
          </button>
          
          <button
            onClick={() => setEditingDraft({
              title: "",
              slug: "",
              prompt: "",
              description: "",
              blog: "",
              seoTitle: "",
              seoDescription: "",
              keywords: "",
              category: "Text Generation",
              thumbnailPrompt: "",
              imagePrompt: "",
              imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
              trendScore: 95,
              qualityScore: 94,
              status: "draft"
            })}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-violet-950/40 transition-all cursor-pointer hover:shadow-violet-800/25 border-none"
          >
            <Plus className="w-4 h-4" /> Create Manual Draft
          </button>
        </div>
      </div>

      {successNotification && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs shadow-lg shadow-emerald-950/20">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
          <span>{successNotification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-xs shadow-lg shadow-red-950/20">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1.5 Interactive GENERATE AI PROMPT Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800/65 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-lg font-bold text-white tracking-tight">Generate AI Prompts</h3>
              </div>
              <button 
                onClick={() => {
                  if (!modalGenerating) setIsGenerateModalOpen(false);
                }}
                disabled={modalGenerating}
                className="text-gray-400 hover:text-white transition-all cursor-pointer disabled:opacity-40 border-none bg-transparent outline-none"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Topic Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Topic</label>
                <input 
                  type="text"
                  placeholder="e.g. Vintage Poster Vector Illustrator or Advanced SQL Query Advisor"
                  value={modalTopic}
                  onChange={(e) => setModalTopic(e.target.value)}
                  disabled={modalGenerating}
                  className="w-full bg-slate-950/80 border border-slate-850 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  disabled={modalGenerating}
                  className="w-full bg-slate-950/85 border border-slate-850 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer transition-all disabled:opacity-50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-950">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Prompts Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Number of Prompts ({modalNumPrompts})
                </label>
                <p className="text-[11px] text-gray-500 mb-2">Configure how many drafts to generate sequentially into your collection.</p>
                <select
                  value={modalNumPrompts}
                  onChange={(e) => setModalNumPrompts(Number(e.target.value))}
                  disabled={modalGenerating}
                  className="w-full bg-slate-950/85 border border-slate-850 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer transition-all disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 10].map((num) => (
                    <option key={num} value={num} className="bg-slate-950">
                      {num} {num === 1 ? 'Prompt Draft' : 'Prompt Drafts'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-850 pt-4">
              <div className="text-xs text-cyan-400 font-medium">
                {modalGenerating && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{modalProgressStatus}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={modalGenerating}
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-slate-950 border border-slate-850 rounded-xl hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modalGenerating || !modalTopic.trim()}
                  onClick={handleModalGenerate}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 disabled:opacity-50 disabled:from-slate-800 disabled:to-slate-900 border-none transition-all cursor-pointer"
                >
                  {modalGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive PREVIEW Overlay Modal */}
      {previewingDraft && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative">
            
            {/* Modal header with cover preview */}
            <div className="relative h-48 w-full bg-slate-950">
              <img 
                src={previewingDraft.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200"}
                alt={previewingDraft.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent" />
              
              <button 
                onClick={() => setPreviewingDraft(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-850 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer border border-slate-700/50"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-[10px] uppercase font-mono font-black px-2.5 py-1 rounded bg-violet-650 text-violet-200 bg-violet-900/80 border border-violet-500/30">
                  {previewingDraft.category}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2 drop-shadow-md">
                  {previewingDraft.title}
                </h3>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              
              {/* Pipeline stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Current Status</span>
                  <div className="text-xs font-black text-rose-300 uppercase mt-1 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-450 bg-violet-400" />
                    {previewingDraft.status}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Trend Score</span>
                  <div className="text-xs font-bold text-cyan-400 mt-1 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {previewingDraft.trendScore}%
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Quality Rating</span>
                  <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    {previewingDraft.qualityScore}%
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">Created On</span>
                  <div className="text-xs font-medium text-gray-300 mt-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(previewingDraft.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <span className="text-xs font-semibold text-gray-400 block mb-1">Tagline Overview</span>
                <p className="text-sm italic text-gray-300 bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
                  "{previewingDraft.description || "No description cataloged for this formula."}"
                </p>
              </div>

              {/* Copiable Prompt Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-violet-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Ready-to-Copy Formula
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewingDraft.prompt);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-slate-900/60 px-2 py-1 rounded"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? "Copied!" : "Copy Formula"}
                  </button>
                </div>
                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-850 text-xs text-slate-100 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                  {previewingDraft.prompt}
                </div>
              </div>

              {/* SEO details */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-cyan-400" /> Target SEO & Discovery Configurations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-normal text-gray-300">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">SEO Meta Title</span>
                    <p className="font-semibold mt-0.5">{previewingDraft.seoTitle || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Meta Description</span>
                    <p className="text-gray-400 mt-0.5">{previewingDraft.seoDescription || "N/A"}</p>
                  </div>
                </div>
                {previewingDraft.keywords && (
                  <div className="pt-2 border-t border-slate-800/50">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Indexed Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewingDraft.keywords.split(",").map((kw, i) => (
                        <span key={i} className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/10">
                          #{kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Extended Blog Tutorial markdown description */}
              {previewingDraft.blog && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-violet-400" /> Interactive Reference Guide & Tutorial Markdown
                  </span>
                  <div className="p-4 bg-slate-900/20 border border-slate-850 rounded-xl text-xs text-gray-300 font-serif leading-relaxed h-52 overflow-y-auto whitespace-pre-wrap">
                    {previewingDraft.blog}
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-850 flex items-center justify-end gap-3.5">
              <button
                onClick={() => setPreviewingDraft(null)}
                className="px-5 py-2 hover:bg-slate-800 rounded-xl text-xs font-extrabold text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                Close Preview
              </button>
              
              {previewingDraft.status !== "published" && (
                <button
                  onClick={() => {
                    handleApproveAndPublish(previewingDraft);
                    setPreviewingDraft(null);
                  }}
                  className="px-4 py-2 bg-emerald-650 hover:bg-emerald-600 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all border-none shadow-lg shadow-emerald-950/30"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Publish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Frame Overlay */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-violet-500/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-violet-500/15 flex items-center justify-between sticky top-0 bg-[#0F172A] z-10">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 font-bold border border-violet-500/25">
                  Pipeline State: Reviewing
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {editingDraft.id ? `Edit Draft: ${editingDraft.title}` : "Polish New AI-Generated Draft"}
                </h3>
              </div>
              <button 
                onClick={() => setEditingDraft(null)} 
                className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Core Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Asset Title</label>
                  <input
                    type="text"
                    value={editingDraft.title || ""}
                    onChange={e => {
                      const typed = e.target.value;
                      const slugified = typed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      setEditingDraft(prev => prev ? { ...prev, title: typed, slug: slugified } : null);
                    }}
                    placeholder="Enter short, descriptive title..."
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Web Friendly Slug (SEO Url)</label>
                  <input
                    type="text"
                    value={editingDraft.slug || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    placeholder="automatic-slug-format"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Tagline / Tag Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Select Domain Category</label>
                  <select
                    value={editingDraft.category || "Text Generation"}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Platform Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={editingDraft.keywords || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, keywords: e.target.value } : null)}
                    placeholder="writing, copy, professional, GPT-4"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Tagline short description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tagline & Short Description</label>
                <input
                  type="text"
                  value={editingDraft.description || ""}
                  onChange={e => setEditingDraft(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Elevates copywriting using sophisticated prompt chaining mechanisms."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Raw Prompt Text */}
              <div>
                <label className="block text-xs font-semibold text-violet-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Target Prompt Template (Ready to Copy)
                </label>
                <textarea
                  rows={4}
                  value={editingDraft.prompt || ""}
                  onChange={e => setEditingDraft(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                  placeholder="Paste or write the complete copyable prompt text here..."
                  className="w-full bg-[#1E293B] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono leading-relaxed focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Blog Tutorial */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Markdown Practical Tutorial</label>
                <textarea
                  rows={6}
                  value={editingDraft.blog || ""}
                  onChange={e => setEditingDraft(prev => prev ? { ...prev, blog: e.target.value } : null)}
                  placeholder="### Dynamic Workflow Tutorial..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-300 font-mono leading-relaxed focus:outline-none"
                />
              </div>

              {/* Cover Image URL upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Asset Cover Illustration URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingDraft.imageUrl || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                  {onUploadMedia && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        disabled={imageUploading}
                      />
                      <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white flex items-center gap-1 h-full cursor-pointer">
                        {imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upload File"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Prompts & Generating Guidelines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-orange-200 mb-1">Midjourney Art Cover Prompt</label>
                  <textarea
                    rows={2}
                    value={editingDraft.imagePrompt || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, imagePrompt: e.target.value } : null)}
                    className="w-full bg-[#1B2230] border border-slate-850 rounded-lg px-2 text-xs text-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-teal-200 mb-1">Thumbnail / Vector Illustration Prompt</label>
                  <textarea
                    rows={2}
                    value={editingDraft.thumbnailPrompt || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, thumbnailPrompt: e.target.value } : null)}
                    className="w-full bg-[#1B2230] border border-slate-850 rounded-lg px-2 text-xs text-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* SEO parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">SEO Title (Target Snippet)</label>
                  <input
                    type="text"
                    value={editingDraft.seoTitle || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, seoTitle: e.target.value } : null)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">SEO Description (Meta Tag)</label>
                  <input
                    type="text"
                    value={editingDraft.seoDescription || ""}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, seoDescription: e.target.value } : null)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Quality Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Review Pipeline Status</label>
                  <select
                    value={editingDraft.status || "draft"}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="draft">Draft (Pending Approval)</option>
                    <option value="rejected">Rejected (Flagged)</option>
                    <option value="published">Published (Storefront Online)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Fidelity score (80-100)</label>
                  <input
                    type="number"
                    value={editingDraft.trendScore || 90}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, trendScore: Number(e.target.value) } : null)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Evaluation Quality (80-100)</label>
                  <input
                    type="number"
                    value={editingDraft.qualityScore || 90}
                    onChange={e => setEditingDraft(prev => prev ? { ...prev, qualityScore: Number(e.target.value) } : null)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/45 border-t border-slate-800/80 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setEditingDraft(null)}
                className="px-4 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer border-none bg-transparent"
              >
                Discard
              </button>
              <button
                onClick={handleSaveToFirestore}
                disabled={savingProgress}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 rounded-xl text-xs font-black text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/30 border-none"
              >
                {savingProgress ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Draft Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast AI Generator Console */}
      <div className="bg-[#111A2E] rounded-2xl p-5 border border-cyan-500/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-cyan-200">Express AI Draft Generation Engine</h3>
        </div>
        
        <p className="text-xs text-gray-400 leading-normal">
          Provide a raw theme, specialized topic, or customer request guidelines. Our active Gemini 3.5 Flash core model will generate ready-to-test prompts, tutorials and SEO metadata instantly.
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={generatorTopic}
            onChange={e => setGeneratorTopic(e.target.value)}
            disabled={generating}
            placeholder="e.g., Deep Learning optimization advisor, professional email auto-responder"
            className="flex-1 bg-[#0F172A] border border-cyan-500/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={generatorCategory}
            onChange={e => setGeneratorCategory(e.target.value)}
            disabled={generating}
            className="bg-[#0F172A] border border-cyan-500/15 rounded-xl px-3 py-3 text-sm text-gray-300 focus:outline-none md:w-56 cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={triggerAIGenerate}
            disabled={generating || !generatorTopic.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-gray-500 px-5 py-3 rounded-xl text-xs font-extrabold text-slate-955 flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer text-black border-none font-bold"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Formulating Draft...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Synthesize Draft
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1.6 AI CONTENT AUTOMATION COMMAND CENTER */}
      <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <h3 className="text-base font-bold text-white font-sans">AI Content Automation Command Center</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Analyze discovered trends, review telemetry system logs, execute automation jobs, and manage administrative notifications.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            {(["factory", "trends", "logs"] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveSubTab(tabKey);
                  if (tabKey === "trends") loadTrends();
                  if (tabKey === "logs") loadLogs();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer border-none ${
                  activeSubTab === tabKey
                    ? "bg-cyan-600/30 text-cyan-300"
                    : "bg-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tabKey}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Bar */}
        {notifications.length > 0 && (
          <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between text-cyan-300 text-xs shadow-lg shadow-cyan-950/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-semibold font-sans">Automation Alert: {notifications[0].text}</span>
            </div>
            <button
              onClick={dismissNotifications}
              className="text-[10px] font-bold text-cyan-400 hover:text-white underline cursor-pointer bg-transparent border-none"
            >
              Mark Read
            </button>
          </div>
        )}

        {/* Tab 1: AI Prompt Factory Queue Generator */}
        {activeSubTab === "factory" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Bulk AI content Factory</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-serif italic">
                Input a base seed keyword or a concept domain. The prompt factory will automatically initiate a search grounded, multi-threaded generator sequence that constructs, drafts, generates cover art via Gemini 2.5 Flash, and registers drafts to your Firestore database.
              </p>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. Vintage midjourney poster design rules, dynamic Kubernetes autoscalers"
                  value={factoryBatchTopic}
                  onChange={e => setFactoryBatchTopic(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all font-mono"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={factoryBatchCategory}
                    onChange={e => setFactoryBatchCategory(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  
                  <select
                    value={factoryBatchSize}
                    onChange={e => setFactoryBatchSize(Number(e.target.value))}
                    className="w-full bg-[#0F172A] border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none cursor-pointer"
                  >
                    {[5, 10, 25, 50].map(val => (
                      <option key={val} value={val}>{val} Drafts</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleFactoryBatchGenerate}
                  disabled={factoryGenerating || !factoryBatchTopic.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-40 border-none"
                >
                  {factoryGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Spawning Content Queue...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Synthesize Factory Queue ({factoryBatchSize} Items)
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/85 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2">6-Hour Cron Scheduler</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Cloud scheduler runs automatically every 6 hours inside the production runtime. Discovery jobs automatically parse fresh trends, filter out duplicates, curate assets and populate the draft queue without publishing.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] font-mono text-gray-500">
                  <div className="bg-[#10141E] p-2.5 rounded-lg border border-slate-850">
                    <span className="text-gray-400 block mb-0.5">Execution Period</span>
                    <span className="text-cyan-300 font-bold">Every 6 Hours</span>
                  </div>
                  <div className="bg-[#10141E] p-2.5 rounded-lg border border-slate-850">
                    <span className="text-gray-400 block mb-0.5">Automations Status</span>
                    <span className="text-emerald-400 font-bold">ACTIVE LOCK</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCurateTrends}
                  disabled={curatingTrends}
                  className="flex-1 py-3 px-4 bg-[#10141E] hover:bg-[#151D30] border border-slate-850 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  {curatingTrends ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : (
                    "Trigger Trend Check"
                  )}
                </button>
                <button
                  onClick={handleTriggerScheduler}
                  disabled={triggeringScheduler}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow-lg shadow-violet-950/20"
                >
                  {triggeringScheduler ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Force Pipeline Run
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Curated Web Trends list */}
        {activeSubTab === "trends" && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-gray-405 uppercase tracking-widest font-mono">Discovered Web Trends ({trendsList.length})</h4>
              <button
                onClick={loadTrends}
                className="text-xs text-cyan-405 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none font-bold"
              >
                <RefreshCw className="w-3 h-3" /> Refresh List
              </button>
            </div>
            {trendsList.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-10 text-center">No trends discovered yet. Click 'Trigger Trend Check' to force instant curation.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trendsList.map(item => (
                  <div key={item.id} className="bg-[#0A0D18] p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-gray-200 line-clamp-1">{item.title}</h5>
                      <span className="text-[10px] font-mono text-gray-500 capitalize">{item.category} • {item.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-950/40 text-cyan-300 border border-cyan-800/25 rounded">Score: {item.trendScore}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                        item.processed 
                          ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/10"
                          : "bg-amber-950/30 text-amber-400 border border-amber-950/10"
                      }`}>
                        {item.processed ? "Processed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Telemetry Execution Logs */}
        {activeSubTab === "logs" && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">System Telemetry Logs</h4>
              <button
                onClick={loadLogs}
                className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none font-bold"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Logs
              </button>
            </div>
            {logsList.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-10 text-center">Empty terminal log trace. Synthesize drafts to populate logs.</p>
            ) : (
              <div className="flex flex-col gap-2 font-mono text-[10px] max-h-60 overflow-y-auto">
                {logsList.map(item => (
                  <div key={item.id} className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-1 leading-normal">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.status === "success" ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-pulse"
                      }`} />
                      <span className="text-cyan-400 font-bold">[{item.type.toUpperCase()}]</span>
                      <span className="text-gray-300">{item.message}</span>
                    </div>
                    <div className="text-gray-500 flex items-center gap-3">
                      <span>Exec: {item.executionTime}ms</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Actions Bar */}
      {selectedDraftIds.length > 0 && (
        <div className="p-4 bg-violet-950/45 border border-violet-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-xl shadow-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="h-5 px-2 bg-violet-500 text-slate-950 text-[10px] font-black rounded-lg flex items-center justify-center">
              {selectedDraftIds.length} Selected
            </span>
            <span className="text-xs text-violet-300 font-medium font-mono">
              Apply bulk publishers/triggers on the selected dataset:
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleBulkAction("publish")}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-white flex items-center gap-1 z-10 cursor-pointer border-none shadow-md shadow-emerald-950/20"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Bulk Publish
            </button>
            <button
              onClick={() => handleBulkAction("reject")}
              className="py-2 px-4 bg-red-950/60 hover:bg-red-900/45 text-red-300 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1 z-10 cursor-pointer shadow-md shadow-slate-950/20"
            >
              <XCircle className="w-3.5 h-3.5 text-red-400" /> Bulk Reject
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="py-2 px-4 bg-[#10141E] hover:bg-slate-800 rounded-xl text-xs text-gray-400 hover:text-white flex items-center gap-1 z-10 cursor-pointer border border-slate-800"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
            </button>
            <button
              onClick={() => setSelectedDraftIds([])}
              className="py-2 px-3 text-xs text-gray-500 hover:text-white cursor-pointer bg-transparent border-none outline-none font-bold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter and Searching block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 bg-[#10141E] px-3.5 py-1.5 rounded-lg border border-slate-850 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prompt drafts by keyword/title/prompt..."
            className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-gray-500 border-none focus:outline-none outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto min-w-max">
          {(["all", "draft", "published", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize cursor-pointer transition-all ${
                statusFilter === f 
                  ? "bg-violet-600/30 text-violet-300 border-violet-500/40" 
                  : "bg-transparent text-gray-400 border-slate-800 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Drafts Listing Grid with Preview Image and customized cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
          <span className="text-xs text-gray-400">Synchronizing database changes...</span>
        </div>
      ) : paginatedDrafts.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
          <FileText className="w-12 h-12 text-slate-700 mx-auto" />
          <p className="text-sm font-semibold text-gray-400 mt-3">No drafts matched filters</p>
          <p className="text-xs text-gray-500 mt-1">Try generating an AI-managed draft from the block above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDrafts.map(d => {
              const isPub = d.status === "published";
              const isRej = d.status === "rejected";
              return (
                <div 
                  key={d.id} 
                  className="bg-slate-900/30 rounded-2xl border border-slate-800 hover:border-slate-705 overflow-hidden transition-all flex flex-col justify-between hover:shadow-xl hover:shadow-slate-950/20 group hover:-translate-y-0.5 duration-200"
                >
                  <div>
                    {/* Visual Preview Image box */}
                    <div className="relative h-44 w-full bg-slate-950 overflow-hidden border-b border-slate-800">
                      <img 
                        src={d.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200"} 
                        alt={d.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                      
                      {/* Checkbox selector */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectDraft(d.id || "");
                        }}
                        className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                          selectedDraftIds.includes(d.id || "")
                            ? "bg-violet-600 border-violet-500 text-white shadow font-bold"
                            : "bg-[#0A0E1A]/90 border-slate-600/60 text-transparent hover:border-violet-500"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Floating Category Badge */}
                      <span className="absolute top-3 left-10 text-[9px] font-mono font-bold px-2 py-1 rounded bg-[#0A0E1A]/90 text-gray-300 flex items-center gap-1 border border-slate-700/50 backdrop-blur-md">
                        <Folder className="w-3 h-3 text-cyan-400" /> {d.category}
                      </span>

                      {/* Status Indicator Badge */}
                      <span className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border backdrop-blur-md ${
                        isPub ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/35" :
                        isRej ? "bg-red-950/90 text-red-300 border-red-500/35" :
                        "bg-yellow-950/90 text-yellow-300 border-yellow-500/35"
                      }`}>
                        {d.status}
                      </span>
                    </div>

                    {/* Meta information area */}
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-extrabold text-white mt-1 font-sans line-clamp-1 group-hover:text-violet-300 transition-colors" title={d.title}>
                        {d.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 h-8 font-serif leading-relaxed italic">
                        "{d.description || "No specific tagline captured."}"
                      </p>

                      <div className="bg-slate-950/60 rounded-lg p-2.5 text-[10px] text-gray-300 font-mono line-clamp-3 h-14 border border-slate-850 leading-relaxed">
                        {d.prompt}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-gray-500 pt-2 border-t border-slate-800/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/5">Q: {d.qualityScore}%</span>
                          <span className="text-cyan-450 text-cyan-300 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/5">T: {d.trendScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls with exact button functions */}
                  <div className="p-3 bg-slate-900/50 border-t border-slate-850 space-y-2">
                    <div className="flex gap-1.5">
                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewingDraft(d)}
                        className="flex-1 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-[11px] font-bold text-gray-300 flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-700/50"
                        title="Display full Prompt Preview"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingDraft(d)}
                        className="flex-1 py-1 px-2.5 bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all border border-violet-500/30"
                        title="Adjust Prompt Schema & Copy text"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    <div className="flex gap-1.5 pt-0.5">
                      {/* Reject Button */}
                      <button
                        onClick={() => handleRejectDraft(d)}
                        disabled={isRej}
                        className="flex-1 py-1.5 px-2 bg-red-950/40 hover:bg-red-900/50 disabled:opacity-45 text-red-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all border border-red-500/25"
                        title="Flag as Rejected"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" /> Reject
                      </button>

                      {/* Approve Button */}
                      <button
                        onClick={() => handleApproveAndPublish(d)}
                        disabled={isPub}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all border-none font-black shadow-lg shadow-emerald-950/10"
                        title="Approve and Publish now"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>

                    <div className="flex items-center justify-end pt-1 border-t border-slate-850/40">
                      <button
                        onClick={() => handleDeleteDraft(d)}
                        className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1 cursor-pointer py-1 px-2 hover:bg-slate-800/40 rounded transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3 h-3" /> De-catalogue
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. PAGINATION Footer Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 mt-4">
              <span className="text-xs text-gray-400 text-center sm:text-left">
                Presenting <span className="text-white font-extrabold">{startIndex + 1}</span> to <span className="text-white font-extrabold">{endIndex}</span> of <span className="text-violet-400 font-extrabold">{totalItems}</span> registered prompt drafts
              </span>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-[#0F172A] hover:bg-slate-850 text-gray-400 hover:text-white rounded-lg border border-slate-800 disabled:opacity-40 disabled:hover:bg-[#0F172A] transition-all cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => {
                    // Quick helper to truncate long lists of pagination indicators if desired
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7.5 h-7.5 flex items-center justify-center rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-violet-600 border-violet-500 text-white font-extrabold shadow-md shadow-violet-950/20"
                            : "bg-[#0F172A] border-slate-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-[#0F172A] hover:bg-slate-850 text-gray-400 hover:text-white rounded-lg border border-slate-800 disabled:opacity-40 disabled:hover:bg-[#0F172A] transition-all cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
