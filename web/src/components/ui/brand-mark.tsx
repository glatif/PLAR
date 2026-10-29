import Link from "next/link";
import { cn } from "@/lib/cn";

/** Product mark: a small teal glass tile with the wordmark. Not a TRU logo (branding pending TRU guidelines). */
export function BrandMark({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-[-0.01em] text-label", className)}>
      <span
        aria-hidden
        className="size-7 rounded-[9px] bg-linear-to-br from-teal-300 to-teal-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),0_4px_14px_rgba(59,181,170,0.35)]"
      />
      <span className="text-[15px]">
        PLAR <span className="text-label-2 font-medium">Platform</span>
      </span>
    </Link>
  );
}
