import Link from "next/link";
import { cn } from "@/lib/cn";

/** Product mark: a tangerine tile with the wordmark. Not a TRU logo (branding pending TRU guidelines). */
export function BrandMark({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-[-0.015em] text-label", className)}>
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-[9px] bg-linear-to-br from-tangerine-300 via-tangerine-500 to-tangerine-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(194,85,10,0.45)]"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19V5h7a4.5 4.5 0 0 1 0 9H5" />
          <path d="M13 14l5 5" />
        </svg>
      </span>
      <span className="text-[15px]">
        PLAR <span className="font-medium text-label-2">Platform</span>
      </span>
    </Link>
  );
}
