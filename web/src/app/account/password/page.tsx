import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/ui/brand-mark";
import { PasswordForm } from "@/app/account/password/password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a password" };

// Anyone signed in can change their password here. People given a temporary password by an admin
// are sent here first (see proxy.ts) and can't open a workspace until they've chosen their own.
export default function PasswordPage() {
  return (
    <main id="main" className="hero-glow flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <BrandMark className="mb-8" />
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-3 sm:p-8">
        <Suspense fallback={<div aria-hidden className="h-72 animate-pulse rounded-md bg-fill-1" />}>
          <Content />
        </Suspense>
      </div>
    </main>
  );
}

async function Content() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const required = user.app_metadata?.must_change_password === true;

  return (
    <>
      <h1 className="font-serif text-[28px] font-semibold leading-[34px] tracking-[-0.022em]">{required ? "Choose your password" : "Change your password"}</h1>
      <p className="mt-2 text-[14.5px] leading-[21px] text-label-2">
        {required
          ? `You signed in with a temporary password. Choose your own to continue. It's for ${user.email}.`
          : `For ${user.email}. You'll stay signed in on this device.`}
      </p>
      <PasswordForm />
      {required ? null : (
        <Link href="/workspace" className="mt-5 inline-flex h-11 items-center rounded-full px-3 text-[14px] font-semibold text-accent-text hover:bg-accent-subtle">
          Cancel
        </Link>
      )}
    </>
  );
}
