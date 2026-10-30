import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { roles } from "@/lib/content";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main id="main" className="hero-glow flex flex-1 flex-col items-center justify-center px-4 py-16">
      <BrandMark className="mb-10" />
      <div className="w-full max-w-md rounded-xl bg-surface p-8 shadow-3">
        <h1 className="font-serif text-[32px] font-semibold leading-[38px] tracking-[-0.022em]">Sign in</h1>
        <p className="mt-2 text-[15px] leading-[22px] text-label-2">
          Use your TRU account to continue. Students, advisors, assessors and PLAR staff all sign in here.
        </p>

        <Button size="lg" className="mt-7 w-full rounded-sm" disabled aria-describedby="sso-note">
          <LockKeyhole aria-hidden className="size-4" />
          Continue with TRU account
        </Button>
        <p id="sso-note" className="mt-3 text-[13px] leading-[18px] text-label-2">
          Single sign-on is connected in the next milestone, once TRU IT confirms the sign-in setup.
        </p>

        <div className="mt-8 border-t border-separator pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">Preview a workspace</p>
          <p className="mt-1 text-[13px] leading-[18px] text-label-2">Development preview with synthetic data. No real student information.</p>
          <ul className="mt-4 overflow-hidden rounded-md bg-surface shadow-1">
            {roles.map((role) => (
              <li key={role.slug} className="border-t border-separator first:border-t-0">
                <Link
                  href={`/workspace/${role.slug}`}
                  className="flex min-h-[56px] items-center gap-3.5 px-4 transition-colors hover:bg-surface-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] text-white" style={{ background: role.tile }}>
                    <role.icon className="size-4" />
                  </span>
                  <span className="flex-1 text-[15px] font-medium">{role.title}</span>
                  <ChevronRight aria-hidden className="size-4 text-label-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Link href="/" className="mt-8 rounded-full px-3 py-1.5 text-[14px] font-medium text-accent-text transition-colors hover:bg-accent-subtle">
        Back to home
      </Link>
    </main>
  );
}
