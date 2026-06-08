import React from "react";
import { Prompt } from "../types";
import { Eye, Copy, Heart, Share2, Sparkles, ExternalLink } from "lucide-react";

interface PromptCardProps {
  key?: React.Key;
  prompt: Prompt;
  onClick: () => void;
  onCopyDirect: (e: React.MouseEvent, prompt: Prompt) => void;
  onLikeDirect: (e: React.MouseEvent, promptId: string) => void;
  copiedId: string | null;
}

export default function PromptCard({
  prompt,
  onClick,
  onCopyDirect,
  onLikeDirect,
  copiedId
}: PromptCardProps) {
  // Determine gradient badges based on platform
  const getBadgeStyle = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "chatgpt":
        return "from-emerald-600 to-green-500 text-emerald-100 border-emerald-500/20";
      case "gemini":
        return "from-blue-600 to-cyan-500 text-blue-100 border-blue-500/20";
      case "claude":
        return "from-amber-700 to-orange-500 text-amber-100 border-amber-500/20";
      case "deepseek":
        return "from-indigo-700 to-blue-500 text-indigo-100 border-indigo-500/20";
      case "midjourney":
        return "from-purple-700 to-fuchsia-500 text-purple-100 border-purple-500/20";
      case "flux":
        return "from-pink-600 to-rose-400 text-pink-100 border-pink-500/20";
      case "sora":
      case "runway":
        return "from-red-600 to-orange-500 text-rose-100 border-red-500/20";
      default:
        return "from-violet-700 to-indigo-500 text-violet-100 border-violet-500/20";
    }
  };

  const isCopied = copiedId === prompt.id;

  return (
    <div
      id={`prompt-card-${prompt.id}`}
      onClick={onClick}
      className={`group relative rounded-2xl bg-[#24324A] border border-violet-500/10 hover:border-violet-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between h-[450px] cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(124,58,237,0.15)] ${
        prompt.animation === "glow-border" ? "shadow-[0_0_15px_rgba(124,58,237,0.08)]" : ""
      }`}
    >
      {/* Visual Accent glow */}
      <div className="absolute -inset-px bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition duration-500" />

      {/* Main image / thumbnail container */}
      <div className="relative h-44 overflow-hidden bg-slate-950">
        <img
          src={prompt.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"}
          alt={prompt.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Soft blackout cover vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#24324A] via-[#24324A]/20 to-transparent" />

        {/* Float tags & badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wide uppercase bg-gradient-to-r border ${getBadgeStyle(prompt.platform)} shadow-lg`}>
            {prompt.platform}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-slate-900/95 text-cyan-300 border border-cyan-500/10">
            {prompt.category}
          </span>
        </div>

        {/* Dynamic micro animation symbol */}
        {prompt.animation && (
          <div className="absolute top-3 right-3 flex items-center justify-center p-1.5 rounded-md bg-violet-950/80 border border-violet-500/30">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-sans font-bold text-white text-base leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
            {prompt.title}
          </h3>

          {/* Short description */}
          <p className="font-sans text-xs text-[#94A3B8] leading-relaxed line-clamp-3 mb-4">
            {prompt.description}
          </p>
        </div>

        {/* Tag row */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {prompt.tags && prompt.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-mono text-gray-400 bg-slate-800/40 px-2 py-0.5 rounded border border-white/5">
                #{tag}
              </span>
            ))}
            {prompt.tags && prompt.tags.length > 3 && (
              <span className="text-[9px] font-mono text-cyan-400 py-0.5 px-1.5 bg-[#1E293B] rounded border border-cyan-500/10">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Action controls footer */}
        <div className="pt-4 border-t border-violet-500/10 flex items-center justify-between">
          {/* Analytics displays */}
          <div className="flex items-center gap-3 text-xs font-mono text-[#94A3B8]">
            <div className="flex items-center gap-1" title={`${prompt.views} Views`}>
              <Eye className="w-3.5 h-3.5 text-violet-400" />
              <span>{prompt.views >= 1000 ? `${(prompt.views / 1000).toFixed(1)}k` : prompt.views}</span>
            </div>

            <div className="flex items-center gap-1" title={`${prompt.copyCount} Copies`}>
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{prompt.copyCount >= 1000 ? `${(prompt.copyCount / 1000).toFixed(1)}k` : prompt.copyCount}</span>
            </div>

            <div
              onClick={(e) => onLikeDirect(e, prompt.id)}
              className="flex items-center gap-1 cursor-pointer hover:text-rose-400 transition-colors group/like"
              title="Like Prompt"
            >
              <Heart className="w-3.5 h-3.5 text-gray-500 group-hover/like:text-rose-500 group-hover/like:scale-110 transition-all" />
              <span>{prompt.likes}</span>
            </div>
          </div>

          {/* Action trigger btn */}
          <div className="flex items-center gap-1.5">
            <button
              id={`quick-copy-btn-${prompt.id}`}
              onClick={(e) => onCopyDirect(e, prompt)}
              className={`p-2 rounded-lg text-xs font-mono font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                isCopied
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                  : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/20"
              }`}
              title="Copy prompt instantly"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isCopied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
