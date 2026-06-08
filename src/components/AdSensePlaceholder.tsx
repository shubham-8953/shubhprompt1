import React from "react";

interface AdSensePlaceholderProps {
  type: "leaderboard" | "skyscraper" | "inline";
  id?: string;
}

export default function AdSensePlaceholder({ type, id }: AdSensePlaceholderProps) {
  const uniqueId = id || `adsense-${type}-${Math.random().toString(36).substring(2, 7)}`;
  
  if (type === "leaderboard") {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        {/* Google AdSense - Top Leaderboard */}
        <div 
          id={uniqueId}
          className="w-full h-24 bg-gradient-to-r from-[#1E293B]/60 to-[#0F172A]/80 border border-dashed border-violet-500/20 rounded-xl flex flex-col items-center justify-center p-3 text-center group hover:border-violet-500/30 transition-colors duration-300 relative overflow-hidden"
        >
          {/* Subtle accent corner indicators representing compliance alignment */}
          <span className="absolute top-1 left-2 text-[8px] font-mono uppercase tracking-wider text-violet-400/40">
            AdSense Optimization Space
          </span>
          <span className="absolute bottom-1 right-2 text-[8px] font-mono uppercase tracking-wider text-cyan-400/30">
            shubhprompt.online
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-mono text-cyan-400/80 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Responsive Leaderboard Frame
            </span>
            <span className="text-[10px] font-mono text-gray-500 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
              728 x 90
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-sans mt-1 max-w-md hidden sm:block">
            Automatically optimized for high-view visibility. This container complies with Google AdSense terms of service.
          </p>
        </div>
      </div>
    );
  }

  if (type === "skyscraper") {
    return (
      <div className="w-full">
        {/* Google AdSense - Sidebar Skyscraper */}
        <div 
          id={uniqueId}
          className="w-full min-h-[480px] bg-gradient-to-b from-[#1E293B]/60 to-[#0F172A]/80 border border-dashed border-violet-500/20 rounded-2xl flex flex-col items-center justify-between p-5 text-center group hover:border-violet-500/30 transition-colors duration-300 relative overflow-hidden h-full"
        >
          <span className="text-[8px] font-mono uppercase tracking-wider text-violet-400/40 text-left w-full">
            Premium Ad Slot
          </span>
          
          <div className="my-auto space-y-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="30 30" />
              </svg>
            </div>
            
            <div>
              <span className="text-xs font-bold font-mono text-[#F8FAFC]/90 uppercase tracking-wider block">
                Sidebar Skyscraper
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5 inline-block mt-1">
                300 x 600
              </span>
            </div>
            
            <p className="text-[10px] text-gray-400 font-sans px-2 leading-relaxed">
              Dynamically served tailored contextual advertisements matched to your AI Prompt queries.
            </p>
          </div>
          
          <span className="text-[8px] font-mono uppercase tracking-wider text-cyan-400/30 text-right w-full">
            AdSense Approved Platform
          </span>
        </div>
      </div>
    );
  }

  // Inline placement inside prompt card rows
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-[#24324A]/40 to-[#1E293B]/40 border border-dashed border-violet-500/10 hover:border-violet-500/35 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 h-[450px]">
      {/* Google AdSense - Inline Ad */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20">
          Sponsored Link
        </span>
        <span className="text-[8px] font-mono text-gray-500">
          shubhprompt.online
        </span>
      </div>

      <div className="my-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center mx-auto text-cyan-400">
          <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
        </div>

        <div>
          <h4 className="text-sm font-bold font-sans text-white">Contextual Recommendation</h4>
          <p className="text-xs text-gray-400 font-sans leading-relaxed mt-2 px-4">
            Earn revenue seamlessly with contextually matched ads targeted to Generative Art creators. This inline box dynamically optimizes layout grids.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-violet-500/10 flex items-center justify-between text-[10px] font-mono text-gray-500">
        <span>Format: Native Card</span>
        <span>Verified Compliance</span>
      </div>
    </div>
  );
}
