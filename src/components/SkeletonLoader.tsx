import React from "react";

export function PromptCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#24324A]/90 border border-violet-500/10 overflow-hidden flex flex-col justify-between h-[450px]">
      {/* Cover Image Placeholder */}
      <div className="relative h-44 bg-[#1E293B] overflow-hidden">
        <div className="w-full h-full shimmer" />
      </div>
      
      {/* Content Placements */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Title bar */}
          <div className="h-5 bg-[#1E293B]/80 rounded w-11/12 shimmer" />
          <div className="h-5 bg-[#1E293B]/80 rounded w-8/12 shimmer" />
          
          {/* Descriptions */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-[#1E293B]/50 rounded w-full shimmer" />
            <div className="h-3 bg-[#1E293B]/50 rounded w-11/12 shimmer" />
            <div className="h-3 bg-[#1E293B]/50 rounded w-3/4 shimmer" />
          </div>
        </div>

        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4 mt-3">
            <div className="h-4 bg-[#1E293B]/60 rounded-md w-12 shimmer" />
            <div className="h-4 bg-[#1E293B]/60 rounded-md w-16 shimmer" />
            <div className="h-4 bg-[#1E293B]/60 rounded-md w-14 shimmer" />
          </div>
          
          {/* Stats Bar */}
          <div className="pt-4 border-t border-violet-500/10 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="h-4 bg-[#1E293B]/70 rounded w-8 shimmer" />
              <div className="h-4 bg-[#1E293B]/70 rounded w-8 shimmer" />
              <div className="h-4 bg-[#1E293B]/70 rounded w-8 shimmer" />
            </div>
            <div className="h-8 bg-[#1E293B]/70 rounded-lg w-16 shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuideCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#24324A]/90 border border-violet-500/10 overflow-hidden flex flex-col justify-between h-[420px]">
      {/* Featured Image placeholder */}
      <div className="relative h-48 bg-[#1E293B] overflow-hidden">
        <div className="w-full h-full shimmer" />
      </div>
      
      {/* Body content placeholders */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3.5 bg-[#1E293B]/60 rounded w-16 shimmer" />
            <div className="h-3.5 bg-[#1E293B]/60 rounded w-14 shimmer" />
          </div>
          
          <div className="h-5 bg-[#1E293B]/80 rounded w-11/12 shimmer" />
          
          <div className="space-y-2">
            <div className="h-3 bg-[#1E293B]/50 rounded w-full shimmer" />
            <div className="h-3 bg-[#1E293B]/50 rounded w-11/12 shimmer" />
            <div className="h-3 bg-[#1E293B]/50 rounded w-4/5 shimmer" />
          </div>
        </div>
        
        {/* Footer info skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-violet-500/5 mt-4">
          <div className="flex gap-1.5">
            <div className="h-4.5 bg-[#1E293B]/60 rounded px-2 w-10 shimmer" />
            <div className="h-4.5 bg-[#1E293B]/60 rounded px-2 w-12 shimmer" />
          </div>
          <div className="h-4 bg-[#1E293B]/70 rounded w-20 shimmer" />
        </div>
      </div>
    </div>
  );
}

export function WatchPromptSkeleton() {
  return (
    <div className="bg-[#24324A]/90 border border-violet-500/10 rounded-2xl overflow-hidden flex flex-col justify-between h-[360px]">
      {/* Thumbnail Aspect Video */}
      <div className="relative aspect-video bg-[#1E293B] overflow-hidden">
        <div className="w-full h-full shimmer" />
      </div>

      {/* Main Info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-5 bg-[#1E293B]/80 rounded w-5/6 shimmer" />
          <div className="space-y-1.5">
            <div className="h-3 bg-[#1E293B]/50 rounded w-full shimmer" />
            <div className="h-3 bg-[#1E293B]/50 rounded w-11/12 shimmer" />
          </div>
        </div>

        {/* Action / Trigger counts and stats */}
        <div className="flex justify-between items-center pt-3 border-t border-violet-500/5 mt-4">
          <div className="h-4.5 bg-[#1E293B]/60 rounded w-16 shimmer" />
          <div className="h-4.5 bg-[#1E293B]/60 rounded w-14 shimmer" />
        </div>
      </div>
    </div>
  );
}
