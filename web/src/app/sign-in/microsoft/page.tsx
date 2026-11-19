import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { MicrosoftLogo } from "@/components/ui/microsoft-logo";
import { initials } from "@/lib/format";
import { demoAccounts } from "@/lib/demo-accounts";
import { microsoftMode } from "@/lib/microsoft-sign-in";
import { demoSignIn } from "@/app/sign-in/actions";

export const metadata: Metadata = { title: "Sign in with Microsoft (demo)" };

// Demo stand-in for TRU's Microsoft sign-in: pick a synthetic work account. Once Entra ID is connected
// (MICROSOFT_SIGN_IN=entra), the Microsoft button goes to Microsoft and this page is no longer used.
export default function MicrosoftDemoPage() {
  return (
    <main id="main" className="hero-glow flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <BrandMark className="mb-8" />
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-3 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2.5 text-[15px] font-semibold">
            <MicrosoftLogo className="size-[19px]" />
            Sign in with Microsoft
          </span>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-ink">Demo</span>
        </div>
        <h1 className="mt-5 font-serif text-[28px] font-semibold leading-[34px] tracking-[-0.022em]">Pick an account</h1>
        <p className="mt-2 text-[14.5px] leading-[21px] text-label-2">
          This stands in for TRU&rsquo;s Microsoft sign-in until it&rsquo;s connected. Each account is a synthetic demo person.
        </p>

        <Suspense fallback={<div aria-hidden className="mt-6 h-80 animate-pulse rounded-md bg-fill-1" />}>
          <Accounts />
        </Suspense>

        <Link
          href="/sign-in"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold text-accent-text transition-colors hover:bg-accent-subtle"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to sign-in
        </Link>
      </div>
    </main>
  );
}

async function Accounts() {
  if ((await microsoftMode()) !== "demo") redirect("/sign-in");
  return (
    <ul className="mt-6 divide-y divide-separator overflow-hidden rounded-md shadow-[inset_0_0_0_1px_var(--separator)]">
      {demoAccounts.map((account) => (
        <li key={account.key}>
          <form action={demoSignIn}>
            <input type="hidden" name="account" value={account.key} />
            <button
              type="submit"
              className="group flex min-h-[64px] w-full items-center gap-3.5 bg-surface px-4 py-3 text-left transition-colors hover:bg-accent-subtle"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                style={{ background: account.tile }}
              >
                {initials(account.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{account.name}</span>
                <span className="block truncate text-[13px] text-label-2">{account.email}</span>
              </span>
              <span className="hidden shrink-0 text-[12.5px] text-label-2 sm:block">{account.role}</span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-label-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
