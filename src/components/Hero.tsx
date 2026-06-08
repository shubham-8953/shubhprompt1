import { Sparkles, ArrowRight, Laptop, Film, CheckCircle2, ChevronDown, Rocket } from "lucide-react";

interface HeroProps {
  onExplorePrompts: () => void;
  onBrowseGuides: () => void;
}

export default function Hero({ onExplorePrompts, onBrowseGuides }: HeroProps) {
  return (
    <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20">
      {/* 1. Real AI / Tech Background Video (Must actually play) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          id="hero-ai-video"
          className="w-full h-full object-cover scale-105 opacity-40 transition-opacity duration-1000"
          poster="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200"
        >
          {/* Multiple mirrors of high-quality abstract futuristic particles/AI looping videos */}
          <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-particles-background-34316-large.mp4" type="video/mp4" />
          <source src="https://assets.mixkit.co/videos/preview/mixkit-background-of-moving-white-particles-on-black-34289-large.mp4" type="video/mp4" />
        </video>
        {/* Soft vignette overlays inside background container */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/75 to-[#0F172A]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-transparent to-[#0F172A]" />
      </div>

      {/* Floating Orbs for aesthetic depth */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl z-1 animate-pulse duration-5000" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl z-1 animate-pulse duration-3000" />

      {/* Content wrapper */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 py-12 md:py-20 flex flex-col items-center">
        {/* Headline */}
        <h1 className="font-sans font-extrabold tracking-tight text-white mb-6 leading-[1.121] text-4xl sm:text-5xl md:text-6xl max-w-4xl text-center">
          Discover Premium <br />
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400 bg-clip-text text-transparent drop-shadow-xl">
            AI Prompts & Workflows
          </span>
        </h1>

        {/* Subheadline as requested exactly */}
        <p className="font-sans text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mb-10 leading-relaxed">
          High-quality prompts, guides, templates, and workflows for ChatGPT, Gemini, Claude, Midjourney, Flux, Veo, Sora, Runway, and future AI tools.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-none">
          {/* Explore Prompts CTA */}
          <button
            id="hero-explore-cta"
            onClick={onExplorePrompts}
            className="w-full sm:w-auto relative group active:scale-95 transition-transform duration-100 cursor-pointer"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 opacity-75 blur-md group-hover:opacity-100 transition duration-300"></div>
            <div className="relative px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full hover:from-violet-500 hover:to-indigo-500 text-white font-sans text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(124,58,237,0.3)] transition-all duration-300">
              <Rocket className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
              Explore Prompts
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Browse Guides CTA */}
          <button
            id="hero-guides-cta"
            onClick={onBrowseGuides}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-violet-500/30 text-white font-sans text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            Browse Guides
          </button>
        </div>

        {/* Supported Platforms ticker logos layout */}
        <div className="mt-16 sm:mt-24 w-full">
          <p className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] mb-6">
            Supported State-of-the-Art Engines
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 max-w-4xl mx-auto opacity-70">
            {["ChatGPT", "Gemini", "Claude", "DeepSeek", "Midjourney", "Flux", "Sora", "Runway"].map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-md bg-[#0F172A]/50 border border-violet-500/10 text-xs font-medium text-gray-300 hover:text-white hover:border-cyan-500/20 hover:scale-105 transition-all duration-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Bounce down indicators */}
        <div className="mt-12 animate-bounce cursor-pointer opacity-50 hover:opacity-100" onClick={onExplorePrompts}>
          <ChevronDown className="w-6 h-6 text-violet-400" />
        </div>
      </div>
    </div>
  );
}
