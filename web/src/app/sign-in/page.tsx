import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { MicrosoftLogo } from "@/components/ui/microsoft-logo";
import { SignInForm } from "@/components/app/sign-in-form";
import { UserFilled } from "@/components/ui/filled-icons";
import { demoAccountGroups } from "@/lib/demo-accounts";
import { demoSignInEnabled, microsoftMode } from "@/lib/microsoft-sign-in";
import { demoSignIn, microsoftSignIn } from "@/app/sign-in/actions";

export const metadata: Metadata = { title: "Sign in" };

const microsoftButton =
  "inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-sm bg-surface text-[16px] font-semibold text-label shadow-[inset_0_0_0_1px_var(--separator-strong),0_1px_2px_rgba(29,29,31,0.05)] transition-[background-color,transform] hover:bg-surface-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

/** "Sign in with Microsoft": the demo account picker for now, TRU's Microsoft Entra ID later. */
async function MicrosoftSignIn() {
  const mode = await microsoftMode();
  return (
    <>
      <form action={microsoftSignIn}>
        <button type="submit" disabled={mode === "off"} className={microsoftButton} aria-describedby="microsoft-note">
          <MicrosoftLogo className="size-[19px]" />
          Sign in with Microsoft
        </button>
      </form>
      <p id="microsoft-note" className="mt-3 text-[13px] leading-[18px] text-label-2">
        {mode === "entra"
          ? "Use your TRU Microsoft account."
          : mode === "demo"
            ? "Demo for now: you pick one of the demo accounts. TRU’s Microsoft sign-in connects here later."
            : "TRU’s Microsoft sign-in is added once TRU IT confirms the setup."}
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <main id="main" className="hero-glow flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <BrandMark className="mb-8" />
      <div className="grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="rounded-xl bg-surface p-8 shadow-3">
          <h1 className="font-serif text-[32px] font-semibold leading-[38px] tracking-[-0.022em]">Sign in</h1>
          <p className="mt-2 text-[15px] leading-[22px] text-label-2">Students, advisors, assessors and PLAR staff all sign in here.</p>

          <div className="mt-7">
            <SignInForm />
          </div>

          <div className="mt-7 border-t border-separator pt-6">
            <Suspense fallback={<div aria-hidden className="h-[52px] animate-pulse rounded-sm bg-fill-1" />}>
              <MicrosoftSignIn />
            </Suspense>
          </div>
        </div>

        <Suspense>
          <DemoAccounts />
        </Suspense>
      </div>
      <Link href="/" className="mt-8 rounded-full px-3 py-1.5 text-[14px] font-medium text-accent-text transition-colors hover:bg-accent-subtle">
        Back to home
      </Link>
    </main>
  );
}

/** One-click demo sign-in, shown only where DEMO_LOGIN_PASSWORD is set (read at request time). */
async function DemoAccounts() {
  if (!(await demoSignInEnabled())) return null;
  return (
    <section aria-labelledby="demo-heading" className="rounded-xl bg-surface p-6 shadow-1 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="demo-heading" className="text-[20px] font-semibold tracking-[-0.015em]">Demo accounts</h2>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-ink">Synthetic data only</span>
      </div>
      <p className="mt-1 text-[14px] leading-[20px] text-label-2">Pick anyone to sign in as them. Every person and case here is made up.</p>

      <div className="mt-6 space-y-5">
        {demoAccountGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">{group.label}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.accounts.map((account) => (
                <li key={account.key}>
                  <form action={demoSignIn}>
                    <input type="hidden" name="account" value={account.key} />
                    <button
                      type="submit"
                      className="group flex min-h-[60px] w-full items-center gap-3 rounded-md bg-surface-2 px-3.5 py-2.5 text-left shadow-[inset_0_0_0_1px_var(--separator)] transition-[background-color,box-shadow,transform] hover:bg-accent-subtle hover:shadow-[inset_0_0_0_1px_var(--color-tangerine-200)] active:scale-[0.98]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: account.tile }}>
                        <UserFilled className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">{account.name}</span>
                        <span className="block truncate text-[12.5px] text-label-2">
                          {account.role} · {account.note}
                        </span>
                      </span>
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-label-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
