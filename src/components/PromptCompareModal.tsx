import React, { useState } from "react";
import { Prompt } from "../types";
import { X, Check, Copy, Scale, ArrowLeftRight, Eye, Heart, BarChart3, HelpCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PromptCompareModalProps {
  promptA: Prompt;
  promptB: Prompt;
  onClose: () => void;
  onClearCompare?: () => void;
}

export default function PromptCompareModal({
  promptA,
  promptB,
  onClose,
  onClearCompare
}: PromptCompareModalProps) {
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const getWordCount = (text: string) => {
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  };

  const getCharCount = (text: string) => {
    return text ? text.length : 0;
  };

  // Helper handler for instant clipboard copy feedback
  const handleCopyText = async (text: string, side: "A" | "B") => {
    try {
      await navigator.clipboard.writeText(text);
      if (side === "A") {
        setCopiedA(true);
        setTimeout(() => setCopiedA(false), 2000);
      } else {
        setCopiedB(true);
        setTimeout(() => setCopiedB(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text into clipboard", err);
    }
  };

  // Metric Comparison computation
  const getHigherClass = (valA: number, valB: number, current: "A" | "B") => {
    if (valA === valB) return "text-gray-400";
    if (current === "A") {
      return valA > valB ? "text-emerald-400 font-bold bg-emerald-500/10 border-emerald-500/20" : "text-[#94A3B8]";
    } else {
      return valB > valA ? "text-emerald-400 font-bold bg-emerald-500/10 border-emerald-500/20" : "text-[#94A3B8]";
    }
  };

  const renderComparisonBar = (valA: number, valB: number) => {
    const total = valA + valB;
    if (total === 0) {
      return (
        <div className="w-full h-1.5 rounded-full bg-slate-850 overflow-hidden flex">
          <div className="w-1/2 bg-[#334155]" />
          <div className="w-1/2 bg-[#475569]" />
        </div>
      );
    }
    const percentA = (valA / total) * 100;
    const percentB = (valB / total) * 100;

    return (
      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex ring-1 ring-white/5">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-violet-500 rounded-l-full transition-all duration-500"
          style={{ width: `${percentA}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-r-full transition-all duration-500"
          style={{ width: `${percentB}%` }}
        />
      </div>
    );
  };

  const wordCountA = getWordCount(promptA.fullPrompt);
  const wordCountB = getWordCount(promptB.fullPrompt);
  const charCountA = getCharCount(promptA.fullPrompt);
  const charCountB = getCharCount(promptB.fullPrompt);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="prompt-compare-modal-overlay">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-6xl rounded-2xl bg-[#0F172A] border border-violet-500/20 shadow-[0_0_50px_rgba(124,58,237,0.25)] flex flex-col h-[90vh] overflow-hidden"
          id="prompt-compare-modal-content"
        >
          {/* Header */}
          <div className="p-6 border-b border-violet-500/10 flex items-center justify-between bg-slate-900/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
                <ArrowLeftRight className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold font-sans text-white flex items-center gap-2">
                  Prompt Comparison
                  <span className="text-xs font-mono font-normal bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded px-2 py-0.5 uppercase tracking-wide">
                    Side-by-Side Dual
                  </span>
                </h2>
                <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
                  Analyze and compare prompt text volume, model target weights, and traffic metrics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onClearCompare && (
                <button
                  onClick={() => {
                    onClearCompare();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-gray-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-white/5 transition"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white bg-slate-800/30 hover:bg-slate-800 border border-white/5 transition-colors"
                title="Close compare container"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body (Scrollable Container Grid) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item A Details */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-violet-500/10 hover:border-violet-500/20 transition duration-300 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <img
                      src={promptA.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"}
                      alt={promptA.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded">
                          Prompt Left
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-mono font-semibold bg-slate-950/80 text-cyan-300 border border-cyan-500/10 rounded">
                          {promptA.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white line-clamp-1">{promptA.title}</h4>
                      <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1">{promptA.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item B Details */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-violet-500/10 hover:border-violet-500/20 transition duration-300 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <img
                      src={promptB.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"}
                      alt={promptB.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded">
                          Prompt Right
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-mono font-semibold bg-slate-950/80 text-cyan-300 border border-cyan-500/10 rounded">
                          {promptB.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white line-clamp-1">{promptB.title}</h4>
                      <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1">{promptB.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- PLATFORM COMPATIBILITY COMPONENT DIFFERENCES --- */}
            <div className="p-5 rounded-2xl bg-[#1E293B]/40 border border-white/5 space-y-4">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-violet-400" />
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold">
                  Compatibility Comparison
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {/* Platform Box Left */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
                  <span className="text-xs text-gray-400 font-mono">Target Platform</span>
                  <span className="text-xs font-mono font-bold text-white bg-violet-600/20 px-3 py-1 rounded border border-violet-500/20 shadow-sm uppercase tracking-wide">
                    {promptA.platform}
                  </span>
                </div>

                {/* Platform Box Right */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-white/5">
                  <span className="text-xs text-gray-400 font-mono">Target Platform</span>
                  <span className="text-xs font-mono font-bold text-white bg-cyan-600/20 px-3 py-1 rounded border border-cyan-500/20 shadow-sm uppercase tracking-wide">
                    {promptB.platform}
                  </span>
                </div>
              </div>

              {/* Tags Cloud Side-by-Side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#94A3B8] tracking-wider block mb-2">
                    Prompt A Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {promptA.tags && promptA.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-violet-300 bg-violet-950/40 px-2.5 py-0.5 rounded border border-violet-500/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-[#94A3B8] tracking-wider block mb-2">
                    Prompt B Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {promptB.tags && promptB.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- TRAFFIC & ENGAGEMENT METRICS COMPARISON --- */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-white/5 space-y-5">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold">
                  Engagement & Analytics Contrast
                </h4>
              </div>

              {/* Metric comparative rows */}
              <div className="space-y-4">
                {/* Views Stat */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-violet-400" />
                      <span>Workspace Views</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded border border-white/5 text-xs font-semibold ${getHigherClass(promptA.views, promptB.views, "A")}`}>
                        {promptA.views}
                      </span>
                      <span className="text-gray-500 font-bold">vs</span>
                      <span className={`px-2 py-0.5 rounded border border-white/5 text-xs font-semibold ${getHigherClass(promptA.views, promptB.views, "B")}`}>
                        {promptB.views}
                      </span>
                    </div>
                  </div>
                  {renderComparisonBar(promptA.views, promptB.views)}
                </div>

                {/* Copies Stat */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Clipboard Copy Count</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded border border-white/5 text-xs font-semibold ${getHigherClass(promptA.copyCount || 0, promptB.copyCount || 0, "A")}`}>
                        {promptA.copyCount || 0}
                      </span>
                      <span className="text-gray-500 font-bold">vs</span>
                      <span className={`px-2 py-0.5 rounded border border-white/5 text-xs font-semibold ${getHigherClass(promptA.copyCount || 0, promptB.copyCount || 0, "B")}`}>
                        {promptB.copyCount || 0}
                      </span>
                    </div>
                  </div>
                  {renderComparisonBar(promptA.copyCount || 0, promptB.copyCount || 0)}
                </div>

                {/* Likes Stat */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>User Favorites (Likes)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded border border-white/5 text-xs font-semibold ${getHigherClass(promptA.likes || 0, promptB.likes || 0, "A")}`}>
                        {promptA.likes || 0}
                      </span>
                      <span className="text-gray-500 font-bold">vs</span>
                      <span className={`px-2 py-0.5 rounded border border-white/5 text-xs font-semibold ${getHigherClass(promptA.likes || 0, promptB.likes || 0, "B")}`}>
                        {promptB.likes || 0}
                      </span>
                    </div>
                  </div>
                  {renderComparisonBar(promptA.likes || 0, promptB.likes || 0)}
                </div>
              </div>
            </div>

            {/* --- FULL PROMPT TEXT COMPARE WINDOWS --- */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold block">
                Direct Full Prompt Comparison
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prompt A Box */}
                <div className="flex flex-col rounded-xl border border-violet-500/10 bg-[#0B0F19] overflow-hidden">
                  <div className="p-3 bg-slate-900/60 border-b border-violet-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-300 font-bold rounded-lg px-2 py-0.5 border border-white/5">
                        Prompt A Text
                      </span>
                      <span className="text-[10px] font-mono text-gray-550 text-[#94A3B8]">
                        {wordCountA} words · {charCountA} chars
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyText(promptA.fullPrompt, "A")}
                      className={`p-1.5 rounded-md text-[10px] font-mono flex items-center gap-1 transition-all duration-300 ${
                        copiedA
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/5"
                      }`}
                      title="Copy Left Prompt"
                    >
                      {copiedA ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 font-mono text-[11px] text-[#CBD5E1] whitespace-pre-wrap max-h-[320px] overflow-y-auto hover:text-white transition-colors custom-scrollbar leading-relaxed">
                    {promptA.fullPrompt}
                  </div>
                </div>

                {/* Prompt B Box */}
                <div className="flex flex-col rounded-xl border border-cyan-500/10 bg-[#0B0F19] overflow-hidden">
                  <div className="p-3 bg-slate-900/60 border-b border-cyan-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 font-bold rounded-lg px-2 py-0.5 border border-white/5">
                        Prompt B Text
                      </span>
                      <span className="text-[10px] font-mono text-gray-550 text-[#94A3B8]">
                        {wordCountB} words · {charCountB} chars
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyText(promptB.fullPrompt, "B")}
                      className={`p-1.5 rounded-md text-[10px] font-mono flex items-center gap-1 transition-all duration-300 ${
                        copiedB
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/5"
                      }`}
                      title="Copy Right Prompt"
                    >
                      {copiedB ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 font-[#CBD5E1] font-mono text-[11px] text-[#CBD5E1] whitespace-pre-wrap max-h-[320px] overflow-y-auto hover:text-white transition-colors custom-scrollbar leading-relaxed">
                    {promptB.fullPrompt}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer controls layout */}
          <div className="p-4 border-t border-violet-500/10 bg-slate-950/60 flex items-center justify-between text-[11px] font-mono text-[#94A3B8] shrink-0">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              Tip: Copy the prompt you prefer and paste it directly into its supported playground.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg font-sans font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:brightness-110 active:scale-95 transition"
            >
              Okay, Close
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
