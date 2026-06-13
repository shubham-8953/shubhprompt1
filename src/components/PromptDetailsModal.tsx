import { useState, useEffect } from "react";
import { Prompt } from "../types";
import { X, Copy, Share2, Heart, ExternalLink, Sparkles, Check, Play, Eye, FileText, LayoutGrid, Cpu, Layers, QrCode, Youtube } from "lucide-react";
import { OriginalYoutubeLogo } from "./OriginalYoutubeLogo";
import QRCode from "qrcode";
import { motion } from "motion/react";

interface PromptDetailsModalProps {
  prompt: Prompt;
  onClose: () => void;
  onCopyDirect: (id: string, text: string) => void;
  onLikeDirect: (id: string) => void;
  onShareDirect?: (id: string) => void;
  copiedId: string | null;
  onToggleCompare?: (prompt: Prompt) => void;
  compareList?: Prompt[];
  onOpenCompare?: () => void;
}

// 200+ Word Editorial Content Generator tailored to satisfy Google AdSense Compliance guidelines
function getEditorialWriteup(prompt: Prompt): string {
  if (prompt.description && prompt.description.length > 250) {
    // If the prompt already has a long writeup, use it alongside standard guidelines
    return prompt.description;
  }
  
  const engine = prompt.platform;
  const isImageGroup = ["midjourney", "flux", "ideogram", "leonardo", "recraft", "bing image creator", "flux.1"].some(term => engine.toLowerCase().includes(term));
  const category = prompt.category || "AI Generation";
  const title = prompt.title;
  
  if (isImageGroup) {
    return `### 🎨 Premium Parameter Tuning & Design Style Logic
For this high-fidelity ${engine} art asset prompt, the architectural visual layout is built around refined artistic keywords and rendering parameters. Achieving the precise visual density of "${title}" requires understanding several key modifier clusters:

1. **Artistic Style Modifiers**: The prompt incorporates descriptive terms that direct the generator towards highly atmospheric, photorealistic, or artistic outcomes. This controls the lighting shadows, volumetric depth, and cinematic grading without cluttering the canvas.
2. **Key Parameters**: For ${engine}, utilizing parameter ratios like \`--ar 16:9\` or \`--stylize 250\` defines the spatial scale. We recommend scaling the stylization density based on how close you want the output to adhere to the literal phrasing.
3. **Lighting & Contrast Controls**: The illumination rules specify terms like "ambient lighting" or "volumetric glowing" to diffuse light rays smoothly across edges. This ensures the output maintains rich contrast, suitable for landing screens and high-resolution marketing cards.

### 🚀 Creative Modifiers & Variations
- **Studio Portrait Version**: To shift the focus, replace background cues with soft-focus studio parameters like \`studio backdrops, dual-tone ring lighting, 85mm portrait focal lens\`.
- **Cyberpunk Slate Variation**: Inject cool neon-cyan undertones by modifying color temperature nouns to \`cinematic nighttime backlighting, saturated indigo hues, slate-grey background accents\`.
- **Minimalist Vector Edition**: Convert the photorealism of the default prompt to a modern flat illustration style by adding \`minimal vector illustration, flat solid colors, Swiss modern layout art, clean SVG paths\`.

### 📝 Step-by-Step Prompt Execution Guide
To run this successfully in your generation console:
First, copy the raw prompt using the ShubhPrompt Copy Engine. Open your target ${engine} workspace, type your command prefix, paste the prompt, and ensure any custom modifiers are placed at the end. For maximum coherence, keep aspect ratios constrained to widescreen and avoid redundant keyword definitions.`;
  } else {
    return `### ⚙️ Logical Systems Architecture & Parameter Rules
This premium text and logical prompt for ${engine} is engineered to act as an advanced instructions file rather than a simple text query. When deploying this template in your active LLM workflow for "${category}", we advise configuring constraints to ensure output stability:

1. **System Prompt Priming**: To achieve the best structural outline for "${title}", paste the copied text into your initial message frame. This establishes standard boundary validators, context windows, and output schemas that prevent hallucination or redundant tokens.
2. **Tone & Composition Modifiers**: The prompt specifies tone parameters like "professional prose", "analytical precision", and "objective overview" to keep responses concise, readable, and highly informative, which is crucial for SEO value and technical documentation.
3. **Execution Instructions & Context Variables**: When utilizing variables (such as custom variables or topic inputs), substitute them inside the designated placeholders. This guarantees the ${engine} model treats the prompt as an automated script, optimizing processing cost.

### 🔧 Performance Modifiers & Variations
- **Technical & Markdown Slate Version**: If you require a highly technical output, append instructions like \`render all results using structured nested tables, bold key terms, and code snippets where appropriate\`.
- **Executive Summary Variation**: For high-level overviews, replace deep analysis structures with requests for \`executive bullet-point indices, direct active verbs, and 150-word scope ceilings\`.
- **Conversational Tutor Edition**: Shift the authoritative tone into an interactive learning dialogue by updating instructions to \`adopt a friendly personal tutor persona, prompt for feedback at each checkpoint, and suggest follow-up queries\`.

### 💡 Workflow Integration & Troubleshooting Tips
To integrate this prompt smoothly:
Copy the raw optimized text using ShubhPrompt. Paste it into your active ${engine} UI. If the model output feels overly broad, refine the parameters by inputting specific bounds, e.g., "Limit your scope entirely to the latest protocols and guidelines." This will immediately improve compliance up to 100%.`;
  }
}

function getPromptMetadata(prompt: Prompt) {
  const platform = prompt.platform.toLowerCase().trim();
  let engine = "GPT-4o";
  let aspectRatio = "Dynamic N/A";
  
  if (platform.includes("midjourney")) {
    engine = "Midjourney v6.0";
    aspectRatio = "16:9";
  } else if (platform.includes("flux")) {
    engine = "Flux.1 Schnell";
    aspectRatio = "1:1";
  } else if (platform.includes("chatgpt")) {
    engine = "GPT-4o (Omni)";
    aspectRatio = "Dynamic Text";
  } else if (platform.includes("gemini")) {
    engine = "Gemini 1.5 Pro";
    aspectRatio = "Dynamic Text";
  } else if (platform.includes("claude")) {
    engine = "Claude 3.5 Sonnet";
    aspectRatio = "Dynamic Text";
  } else if (platform.includes("deepseek")) {
    engine = "DeepSeek-V3";
    aspectRatio = "Dynamic Text";
  } else if (["sora", "runway", "veo", "video"].some(t => platform.includes(t))) {
    engine = "Lumiere / Sora Video";
    aspectRatio = "16:9 Video";
  } else {
    engine = `${prompt.platform} Engine`;
    aspectRatio = "Adjustable";
  }
  
  return { engine, aspectRatio };
}

export default function PromptDetailsModal({
  prompt,
  onClose,
  onCopyDirect,
  onLikeDirect,
  onShareDirect,
  copiedId,
  onToggleCompare,
  compareList,
  onOpenCompare
}: PromptDetailsModalProps) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [localCopied, setLocalCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    const generateQrUrl = async () => {
      try {
        const u = `${window.location.origin}/prompt/${prompt.id}`;
        const dataUrl = await QRCode.toDataURL(u, {
          width: 300,
          margin: 1,
          color: {
            dark: "#0F172A", // Dark slate fill
            light: "#FFFFFF"  // Pure white border
          },
          errorCorrectionLevel: "H"
        });
        if (active) {
          setQrCodeUrl(dataUrl);
        }
      } catch (err) {
        console.error("QR Code generation failed", err);
      }
    };
    generateQrUrl();
    return () => {
      active = false;
    };
  }, [prompt.id]);

  const PLATFORM_URLS: Record<string, string> = {
    chatgpt: "https://chatgpt.com",
    gemini: "https://gemini.google.com",
    claude: "https://claude.ai",
    grok: "https://grok.com",
    perplexity: "https://perplexity.ai",
    deepseek: "https://chat.deepseek.com",
    midjourney: "https://midjourney.com",
    flux: "https://fal.ai",
    ideogram: "https://ideogram.ai",
    "leonardo ai": "https://leonardo.ai",
    recraft: "https://www.recraft.ai",
    veo: "https://video-generation.google",
    sora: "https://openai.com/sora",
    runway: "https://runwayml.com",
    kling: "https://klingai.com",
    pika: "https://pika.art"
  };

  const getPlatformUrl = (platform: string) => {
    return PLATFORM_URLS[platform.toLowerCase().trim()] || "https://google.com";
  };

  const handleShare = () => {
    const cleanUrl = `${window.location.origin}/prompt/${prompt.id}`;
    navigator.clipboard.writeText(cleanUrl);
    setShareFeedback(true);
    if (onShareDirect) {
      onShareDirect(prompt.id);
    }
    setTimeout(() => setShareFeedback(false), 2000);
  };

  const handleLocalCopy = () => {
    onCopyDirect(prompt.id, prompt.fullPrompt);
    setLocalCopied(true);
    setTimeout(() => setLocalCopied(false), 2000);
  };

  const isCopied = copiedId === prompt.id || localCopied;
  const { engine, aspectRatio } = getPromptMetadata(prompt);
  const editorialContent = getEditorialWriteup(prompt);

  const platformsToRender = prompt.platform
    .split("+")
    .map(p => p.trim());

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md" onClick={onClose} />

      {/* Main Container Overhaul */}
      <div className="relative w-full max-w-4xl bg-[#1E293B] border border-violet-500/20 rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)] z-10 flex flex-col max-h-[92vh]">
        
        {/* Action Controls */}
        <div className="absolute top-12 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-slate-900/80 border border-white/10 hover:border-violet-500/30 text-gray-300 hover:text-cyan-400 backdrop-blur transition shadow-md"
            title="Copy Share Link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900/80 border border-white/10 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 backdrop-blur transition shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Core Sheet */}
        <div className="overflow-y-auto flex-1">
          
          {/* Canvas Frame holding image previews */}
          <div className="relative h-64 md:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
            <>
              <img
                src={prompt.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200"}
                alt={prompt.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
              />
              
              {/* Visual shade overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-[#1E293B]/20 to-transparent" />

              {/* Cover-to-Video CTA Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <a
                  href="https://www.youtube.com/@ShubhPrompt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 rounded-full bg-red-650/95 text-white border border-red-500 hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.5)] transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 font-semibold text-sm cursor-pointer select-none"
                >
                  <OriginalYoutubeLogo className="w-6 h-6 animate-pulse shrink-0" />
                  <span>How to Use Shubh Prompt</span>
                </a>
              </div>
            </>

            {/* Bottom Floating Info Badge */}
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-xs font-mono text-cyan-300 rounded-full flex items-center gap-1.5 backdrop-blur shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                {prompt.category}
              </span>
            </div>
          </div>

          {/* Grid Layout Core */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Main Content and Interactive Elements */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Meta Header Bar with precise alignment badges */}
              <div className="flex flex-wrap items-center gap-2 bg-[#0F172A]/50 p-3.5 rounded-2xl border border-violet-500/10">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-xs font-mono text-cyan-400 rounded-lg">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Engine: <strong>{engine}</strong></span>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600/10 border border-cyan-500/20 text-xs font-mono text-cyan-300 rounded-lg">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Aspect: <strong>{aspectRatio}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-600/10 border border-orange-500/20 text-xs font-mono text-orange-300 rounded-lg">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Category: <strong>{prompt.category}</strong></span>
                </div>
              </div>

              {/* Title & Static description */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-sans text-white leading-snug">
                  {prompt.title}
                </h1>
                <p className="text-xs text-gray-400 font-sans mt-2 ml-1">
                  shubhprompt.online premium asset &bull; Uploaded {new Date(prompt.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A]/50 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] font-bold block">Overview Description</span>
                <p className="font-sans text-sm text-gray-300 leading-relaxed">
                  {prompt.description}
                </p>
              </div>

              {/* Copy Engine Component */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold font-sans text-cyan-400 ml-1">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Copy Engine Component (Verbatim Token Code)
                  </span>
                  
                  <span className="text-[9px] text-[#94A3B8] font-mono">
                    Character Count: {prompt.fullPrompt?.length || 0}
                  </span>
                </div>

                <div className="relative group rounded-2xl overflow-hidden shadow-inner">
                  {/* Copy CTA Action button changing state smoothly */}
                  <div className="absolute right-3 top-3 opacity-95 hover:opacity-100 z-10">
                    <button
                      onClick={handleLocalCopy}
                      className={`p-2.5 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold transition-all duration-300 shadow-md ${
                        isCopied
                          ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                          : "bg-[#0F172A] hover:bg-slate-950 text-[#94A3B8] hover:text-white border border-white/10 hover:border-violet-500/30 cursor-pointer"
                      }`}
                    >
                      {isCopied ? <Check className="w-4 h-4 animate-bounce text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>

                  {/* Code-cell raw box container */}
                  <pre className="p-5 pt-16 rounded-2xl bg-slate-950/90 border border-violet-500/10 text-white text-xs md:text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-72 select-all ring-1 ring-violet-500/5 hover:ring-violet-500/20 transition-all">
                    {prompt.fullPrompt}
                  </pre>
                </div>
              </div>

              {/* Dynamic Editorial Box (Anti Low-Value Content assurance) */}
              <div className="pt-6 border-t border-violet-500/10 mt-6">
                <div className="p-6 rounded-2xl bg-slate-900/30 border border-violet-500/10 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-white border-b border-violet-500/10 pb-3">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="font-sans font-bold text-base text-[#F8FAFC]">
                      Expert Editorial Guide & Model Tutorial
                    </h3>
                  </div>

                  {/* Rich markdown manual tutorial layout */}
                  <div className="text-gray-300 text-xs md:text-sm font-sans leading-relaxed whitespace-pre-line space-y-4">
                    {editorialContent}
                  </div>
                </div>
              </div>

            </div>

            {/* Right sidebar: Interactive Actions & Dynamic Tools */}
            <div className="space-y-6">
              
              {/* Direct Workspace launchers */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-violet-500/10 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">
                    System Actions
                  </h4>
                </div>

                {/* Core copy block */}
                <button
                  id="modal-action-copy-trigger"
                  onClick={handleLocalCopy}
                  className={`w-full py-3 px-4 rounded-xl font-sans text-sm font-bold flex items-center justify-center gap-2 border transition-all duration-300 cursor-pointer ${
                    isCopied
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-[#7C3AED] hover:bg-[#6c30db] text-white border-[#7C3AED]/20 shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {isCopied ? "Prompt Copied" : "Copy Main Prompt"}
                </button>

                {/* Share Link copies to clipboard */}
                <button
                  onClick={handleShare}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-gray-300 hover:text-white border border-white/10 hover:border-violet-500/20 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  {shareFeedback ? "Share Link Copied!" : "Share Prompt Page"}
                </button>

                <button
                  onClick={() => onLikeDirect(prompt.id)}
                  className="w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition duration-300 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Like Prompt ({prompt.total_likes || prompt.likes || 0})</span>
                </button>

                {/* How to Use Shubh Prompt tutorial button */}
                <a
                  href="https://www.youtube.com/@ShubhPrompt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-sans text-xs font-semibold flex items-center justify-center gap-2 transition duration-300 shadow-md cursor-pointer text-center select-none"
                >
                  <OriginalYoutubeLogo className="w-5 h-4 shrink-0 animate-pulse" />
                  <span>How to Use Shubh Prompt</span>
                </a>

                {/* Compare Layout Engine side-by-side component toggle button */}
                {onToggleCompare && (
                  <button
                    onClick={() => onToggleCompare(prompt)}
                    className={`w-full py-3 px-4 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-2 border transition-all duration-300 cursor-pointer ${
                      compareList?.some(p => p.id === prompt.id)
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        : "bg-slate-900/65 hover:bg-slate-900 text-cyan-300 hover:text-white border border-cyan-500/15 hover:border-cyan-500/30"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>
                      {compareList?.some(p => p.id === prompt.id)
                        ? "In Comparison (Remove)"
                        : "Compare Layout Engine"}
                    </span>
                  </button>
                )}

                {/* Deep platform link trigger */}
                {platformsToRender.map((pName) => {
                  const url = getPlatformUrl(pName);
                  return (
                    <a
                      key={pName}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-[#0F172A] text-cyan-300 hover:text-white border border-cyan-500/15 hover:border-cyan-500/30 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 block text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-500" />
                      Run Prompt in {pName} &rarr;
                    </a>
                  );
                })}

              </div>

              {/* QR Code Container for Mobile Instancy */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-violet-500/10 space-y-3.5 shadow-xl flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5 self-start">
                  <QrCode className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] font-bold">
                    Scan for Mobile
                  </h4>
                </div>
                
                <p className="text-[11px] font-sans text-gray-450 leading-relaxed text-[#94A3B8]">
                  Scan to preview and instantly run this prompt on your mobile phone or tablet.
                </p>

                <div className="relative group p-2.5 bg-white rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.1)] hover:shadow-[0_0_35px_rgba(6,182,212,0.25)] ring-1 ring-violet-500/20 transition-all duration-300 overflow-hidden">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Prompt QR Code"
                      className="w-36 h-36 rounded-xl select-none"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs font-mono text-gray-500">
                      Generating QR...
                    </div>
                  )}

                  {/* Laser Sweeper Sweep Overlay */}
                  {qrCodeUrl && (
                    <motion.div
                      animate={{
                        y: ["0px", "144px", "0px"]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10 pointer-events-none"
                    />
                  )}
                </div>

                <div className="w-full text-[9px] font-mono text-cyan-400/80 bg-slate-950/65 border border-white/5 rounded-lg py-1.5 px-2 max-w-full truncate select-all" title="Direct URL">
                  {`${window.location.origin}/prompt/${prompt.id}`}
                </div>
              </div>

              {/* Beautifully aligned interactive metrics panel */}
              <div className="p-5 rounded-2xl bg-[#0F172A]/80 border border-violet-500/15 space-y-3 shadow-xl">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] font-bold block border-b border-white/5 pb-2">
                  Analytics & Dynamic Stats
                </span>
                
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center">
                    <Eye className="w-4 h-4 text-violet-400 mb-1" />
                    <span className="text-xs font-mono font-bold text-white block">
                      {prompt.total_views || prompt.views || 0}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-[#94A3B8] mt-0.5">Views</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500 mb-1" />
                    <span className="text-xs font-mono font-bold text-white block">
                      {prompt.total_likes || prompt.likes || 0}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-[#94A3B8] mt-0.5">Likes</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center flex-1">
                    <Share2 className="w-4 h-4 text-cyan-400 mb-1" />
                    <span className="text-xs font-mono font-bold text-white block">
                      {prompt.total_shares || prompt.shares || 0}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-[#94A3B8] mt-0.5">Shares</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
