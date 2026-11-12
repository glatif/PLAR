"use client";

import { useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { CheckCircleFilled } from "@/components/ui/filled-icons";
import { cn } from "@/lib/cn";

// Shown after each photo: a clear look at what was captured, a short checklist, and an explicit
// choice to retake or use it. ID photos need a confirmation tick before they're saved.

const checklists = {
  face: ["Your whole face is in the photo", "It's sharp and evenly lit", "No sunglasses, hat or mask"],
  id: ["All four corners of the card are visible", "Your name, photo and dates are sharp and readable", "No glare or fingers covering details"],
};

export function ReviewSheet({
  kind,
  title,
  imageUrl,
  flagged,
  onRetake,
  onConfirm,
}: {
  kind: "face" | "id";
  title: string;
  imageUrl: string;
  /** Shown when the photo was taken without the automatic check passing. */
  flagged?: string | null;
  onRetake: () => void;
  onConfirm: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  const [confirmed, setConfirmed] = useState(kind === "face");

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#141416] text-white" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="px-5 pt-[max(env(safe-area-inset-top),16px)] text-center">
        <h2 id="review-title" className="font-serif text-[26px] font-semibold leading-[32px] tracking-[-0.02em]">
          {title}
        </h2>
      </div>

      <div className={cn("relative mx-4 mt-4 flex-1 overflow-hidden rounded-[20px] bg-black", zoom ? "overflow-auto" : "flex items-center justify-center")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL of the photo just taken */}
        <img
          src={imageUrl}
          alt="The photo you just took"
          className={cn(zoom ? "max-w-none" : "max-h-full max-w-full object-contain")}
          style={zoom ? { width: "250%" } : undefined}
          onDoubleClick={() => setZoom((z) => !z)}
        />
        <button
          type="button"
          onClick={() => setZoom((z) => !z)}
          className="absolute bottom-3 right-3 flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3.5 text-[13px] font-semibold backdrop-blur-xl"
        >
          {zoom ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
          {zoom ? "Fit" : "Zoom in"}
        </button>
      </div>

      <div className="mx-auto w-full max-w-md px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4">
        {flagged ? <p className="mb-3 rounded-[12px] bg-[#7a5200]/40 px-3.5 py-2.5 text-[13.5px] leading-[19px] text-[#ffd3aa]">{flagged}</p> : null}
        <ul className="space-y-2">
          {checklists[kind].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[14.5px] leading-[20px] text-white/90">
              <CheckCircleFilled className="mt-0.5 size-4 shrink-0 text-[#4cd58a]" />
              {item}
            </li>
          ))}
        </ul>
        {kind === "id" ? (
          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] border border-white/15 bg-white/[0.06] px-3.5 py-2.5">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-5 shrink-0 accent-[#c2550a]"
            />
            <span className="text-[14.5px] font-medium leading-[20px]">Everything is clear and the text is readable</span>
          </label>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 text-[16px] font-semibold active:scale-[0.97]"
          >
            <RotateCcw className="size-4" />
            Retake
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed}
            className="h-[52px] rounded-full bg-accent text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-[opacity,transform] active:scale-[0.97] disabled:opacity-40"
          >
            {kind === "id" ? "Save photo" : "Use this photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
