import React, { useEffect } from "react";
import { Check, Link, Copy, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ToastItem {
  id: string;
  type: "copy" | "share" | "success" | "info";
  message: string;
  title?: string;
  platform?: string;
  duration?: number; // duration in ms
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export default function ToastNotification({ toasts, onClose }: ToastNotificationProps) {
  return (
    <div
      id="toast-notifications-container"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void; key?: React.Key }) {
  const { id, type, message, title, platform, duration = 3000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "copy":
        return (
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
            <Check className="w-5 h-5" />
          </div>
        );
      case "share":
        return (
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shadow-inner">
            <Link className="w-5 h-5" />
          </div>
        );
      case "success":
        return (
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-slate-500/10 text-slate-400 rounded-xl border border-slate-500/20 shadow-inner">
            <Copy className="w-5 h-5" />
          </div>
        );
    }
  };

  const getPlatformBadgeClass = (p?: string) => {
    if (!p) return "";
    switch (p.toLowerCase().trim()) {
      case "chatgpt":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "gemini":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "claude":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "deepseek":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      case "midjourney":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-gray-300 border-white/5";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
      className="pointer-events-auto w-full bg-[#1e293b]/95 backdrop-blur-md border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col relative"
    >
      <div className="flex gap-4 p-4 items-start">
        {/* Animated Icon Container */}
        <div className="shrink-0">{getIcon()}</div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-sm font-bold font-sans text-white tracking-wide truncate">
            {message}
          </h4>
          
          {title && (
            <p className="text-xs text-gray-400 font-sans mt-0.5 truncate leading-relaxed">
              {title}
            </p>
          )}

          {platform && (
            <div className="flex mt-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase border ${getPlatformBadgeClass(platform)}`}>
                {platform}
              </span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onClose(id)}
          className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dynamic Animated Timeout Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
        />
      </div>
    </motion.div>
  );
}
