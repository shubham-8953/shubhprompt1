import { useState } from "react";
import { Guide, Prompt } from "../types";
import { BookOpen, Search, Eye, Sparkles, Video, Calendar, ArrowUpRight, Play, X, ArrowLeft, Tag } from "lucide-react";

interface GuideSectionProps {
  guides: Guide[];
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onTrackAction: (type: string, details: any) => void;
}

export default function GuideSection({
  guides,
  prompts,
  onSelectPrompt,
  onTrackAction
}: GuideSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Filter guides
  const filteredGuides = guides.filter(g => {
    const q = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.content.toLowerCase().includes(q) ||
      g.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const handleOpenGuide = (guide: Guide) => {
    setSelectedGuide(guide);
    setIsPlayingVideo(false);
    // Track guide view
    onTrackAction("view_guide", { guideId: guide.id });
  };

  return (
    <div className="space-y-8">
      {/* 1. Header/Toolbar (unless expanded view in place) */}
      {!selectedGuide ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-sans text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                AI Engineering & Synthesis Guides
              </h2>
              <p className="text-[#94A3B8] text-sm font-sans mt-1">
                Practical, production-tested deep-dives into leading models and systems.
              </p>
            </div>

            {/* Guides search box */}
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-violet-400" />
              </span>
              <input
                id="search-input-guides"
                type="text"
                placeholder="Search guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E293B] border border-violet-500/20 hover:border-violet-500/40 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-400 transition"
              />
            </div>
          </div>

          {/* Grid list of guides */}
          {filteredGuides.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-violet-500/10">
              <p className="text-gray-400 font-sans text-sm">No engineering guides found matching your query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredGuides.map(guide => (
                <div
                  key={guide.id}
                  id={`guide-card-${guide.id}`}
                  onClick={() => handleOpenGuide(guide)}
                  className="group bg-[#24324A] rounded-2xl border border-violet-500/10 hover:border-violet-500/40 cursor-pointer overflow-hidden transform hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img
                      src={guide.featuredImage}
                      alt={guide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#24324A] via-[#24324A]/40 to-transparent" />

                    {/* Tags overlay */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide uppercase bg-slate-950 text-cyan-300 border border-cyan-500/10 rounded">
                        Guide Book
                      </span>
                    </div>

                    {guide.video && (
                      <div className="absolute bottom-4 right-4 p-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 backdrop-blur">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(guide.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-violet-400" />
                          {guide.views} Views
                        </span>
                      </div>

                      <h3 className="font-sans font-bold text-white text-lg group-hover:text-cyan-300 transition line-clamp-2">
                        {guide.title}
                      </h3>

                      <p className="font-sans text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
                        {guide.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-violet-500/5">
                      <div className="flex flex-wrap gap-1">
                        {guide.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] font-mono text-gray-400 bg-slate-800/40 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1 group-hover:underline">
                        Read Guide
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Expanded Guide details view */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedGuide(null)}
            className="px-4 py-2 text-xs font-mono text-cyan-400 hover:text-white bg-[#1E293B] hover:bg-violet-950/20 border border-violet-500/10 rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guides List
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Guide content body (Left 2 columns) */}
            <div className="lg:col-span-2 bg-[#24324A]/50 border border-violet-500/15 rounded-3xl p-6 md:p-8 space-y-6">
              {/* Media banner */}
              <div className="relative h-60 md:h-80 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl">
                {selectedGuide.video && isPlayingVideo ? (
                  <video
                    src={selectedGuide.video}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      src={selectedGuide.featuredImage}
                      alt={selectedGuide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {selectedGuide.video && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => setIsPlayingVideo(true)}
                          className="p-5 rounded-full bg-cyan-600 hover:bg-cyan-500 shadow-2xl text-white transform hover:scale-105 active:scale-95 transition flex items-center gap-2"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          <span className="font-sans text-sm font-semibold">Play Tutorial video</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Title Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
                  <span className="bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">
                    Category: Synthesis
                  </span>
                  <span>Published: {new Date(selectedGuide.createdAt).toLocaleDateString()}</span>
                  <span>{selectedGuide.views} Views</span>
                </div>

                <h1 className="text-xl md:text-3xl font-bold font-sans text-white leading-tight">
                  {selectedGuide.title}
                </h1>
              </div>

              {/* MD Render container */}
              <div className="border-t border-violet-500/10 pt-6 prose prose-invert font-sans text-sm text-gray-300 leading-relaxed space-y-6">
                {/* Standard robust split parser for rendering titles, codes, paragraphs beautifully without external loader crashes */}
                {selectedGuide.content.split("\n\n").map((chunk, itemIdx) => {
                  if (chunk.startsWith("###")) {
                    return (
                      <h3 key={itemIdx} className="text-lg font-bold text-white font-sans mt-6">
                        {chunk.replace("###", "").trim()}
                      </h3>
                    );
                  } else if (chunk.startsWith("```")) {
                    const lines = chunk.split("\n");
                    const rawCode = lines.slice(1, -1).join("\n");
                    return (
                      <pre key={itemIdx} className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-violet-500/10 overflow-x-auto whitespace-pre">
                        {rawCode}
                      </pre>
                    );
                  } else if (chunk.startsWith("- ")) {
                    const bulletItems = chunk.split("\n").map(li => li.replace("- ", "").trim());
                    return (
                      <ul key={itemIdx} className="list-disc pl-5 space-y-1.5 text-gray-300">
                        {bulletItems.map((bi, i) => (
                          <li key={i}>{bi}</li>
                        ))}
                      </ul>
                    );
                  } else {
                    return (
                      <p key={itemIdx} className="leading-relaxed">
                        {chunk}
                      </p>
                    );
                  }
                })}
              </div>
            </div>

            {/* Sidebar (Right 1 column): Related Prompts & Tags list */}
            <div className="space-y-6">
              {/* Related Prompts panel */}
              <div className="p-5 rounded-3xl bg-slate-900/40 border border-violet-500/15 space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-[#94A3B8] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Related Prompts
                </h4>

                <div className="space-y-3">
                  {prompts.filter(p => selectedGuide.relatedPrompts.includes(p.id)).length === 0 ? (
                    <p className="text-xs font-mono text-gray-500">No prompt templates associated yet.</p>
                  ) : (
                    prompts
                      .filter(p => selectedGuide.relatedPrompts.includes(p.id))
                      .map(prompt => (
                        <div
                          key={prompt.id}
                          onClick={() => onSelectPrompt(prompt)}
                          className="p-3.5 rounded-xl bg-[#24324A] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer flex items-center gap-3 active:scale-[0.98]"
                        >
                          <img
                            src={prompt.coverImage}
                            alt={prompt.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-sans font-bold text-white truncate group-hover:text-cyan-400">
                              {prompt.title}
                            </h5>
                            <span className="text-[9px] font-mono font-medium text-cyan-300 px-1.5 py-0.5 rounded bg-slate-950 border border-white/5 mt-1 inline-block">
                              {prompt.platform}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Tag bucket */}
              <div className="p-5 rounded-3xl bg-slate-900/40 border border-violet-500/15 space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-widest text-[#94A3B8] font-bold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-violet-400" />
                  Meta Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGuide.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded bg-slate-950 text-[10px] font-mono text-gray-300 border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
