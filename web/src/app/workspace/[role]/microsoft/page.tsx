import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MicrosoftLogo } from "@/components/ui/microsoft-logo";
import { AlertFilled, CheckCircleFilled, ClockFilled, InfoFilled } from "@/components/ui/filled-icons";
import { getViewer } from "@/lib/auth";
import { microsoftMode } from "@/lib/microsoft-sign-in";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Microsoft sign-in" };

const REDIRECT_URI = "https://plar-api.airl.ca/auth/v1/callback";

// Admin only: where "Sign in with Microsoft" stands, and what's needed to connect TRU's accounts.
export default function MicrosoftPage({ params }: PageProps<"/workspace/[role]/microsoft">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-lg bg-fill-1" />}>
      <Microsoft params={params} />
    </Suspense>
  );
}

/** Is the Microsoft provider switched on in the Supabase the app talks to? Asks Auth's public settings. */
async function providerOn(): Promise<boolean | null> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabasePublishableKey }, cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { external?: Record<string, boolean> };
    return Boolean(json.external?.azure);
  } catch {
    return null;
  }
}

function StatusRow({ label, value, tone, hint }: { label: string; value: string; tone: "success" | "warning" | "neutral"; hint: string }) {
  const icon = tone === "success" ? <CheckCircleFilled /> : tone === "warning" ? <ClockFilled /> : undefined;
  return (
    <div className="flex flex-col gap-1 border-b border-separator py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-[15px] font-semibold">{label}</p>
        <p className="text-[13.5px] text-label-2">{hint}</p>
      </div>
      <Badge tone={tone} icon={icon}>
        {value}
      </Badge>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-[22px]">
          <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ tone, children }: { tone: "info" | "warning"; children: ReactNode }) {
  return (
    <div
      role="note"
      className={
        tone === "info"
          ? "flex items-start gap-3 rounded-md bg-accent-subtle px-4 py-3 text-[14.5px] leading-[21px] text-accent-ink shadow-[inset_0_0_0_1px_var(--color-tangerine-200)]"
          : "flex items-start gap-3 rounded-md bg-warning-subtle px-4 py-3 text-[14.5px] leading-[21px] text-warning"
      }
    >
      {tone === "info" ? <InfoFilled className="mt-0.5 size-4 shrink-0 text-accent-text" /> : <AlertFilled className="mt-0.5 size-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

async function Microsoft({ params }: { params: PageProps<"/workspace/[role]/microsoft">["params"] }) {
  const { role } = await params;
  if (role !== "admin") notFound();
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.workspaces.includes("admin")) redirect("/workspace");

  const [mode, provider] = await Promise.all([microsoftMode(), providerOn()]);
  const onServer = supabaseUrl.includes("plar-api.airl.ca");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">Admin · Microsoft sign-in</p>
        <h1 className="mt-2 flex items-center gap-3 font-serif text-[36px] font-semibold leading-[42px] tracking-[-0.025em]">
          <MicrosoftLogo className="size-7 shrink-0" />
          Sign in with TRU Microsoft accounts
        </h1>
        <p className="mt-2 max-w-3xl text-[16px] leading-[24px] text-label-2">
          TRU uses Microsoft accounts for everything, Moodle included. This page shows what&rsquo;s ready on our side and what TRU IT needs to do.
        </p>
      </header>

      <section aria-label="Status" className="card px-6 py-2">
        <StatusRow
          label="“Sign in with Microsoft” button"
          value={mode === "entra" ? "Live" : mode === "demo" ? "Demo" : "Hidden"}
          tone={mode === "entra" ? "success" : "warning"}
          hint={mode === "entra" ? "Goes to TRU’s Microsoft sign-in." : "For now it opens a list of demo accounts."}
        />
        <StatusRow
          label="Microsoft connected to PLAR’s database"
          value={provider ? "Connected" : provider === null ? "Can’t check" : "Waiting for TRU IT"}
          tone={provider ? "success" : "warning"}
          hint={provider ? "TRU’s app values are in place." : "Needs TRU’s app registration (below)."}
        />
        <StatusRow
          label="PLAR’s own database on the server"
          value={onServer ? "In use" : "Waiting for DNS"}
          tone={onServer ? "success" : "warning"}
          hint={onServer ? "plar-api.airl.ca" : "The plar-api.airl.ca address is being added at Porkbun."}
        />
      </section>

      <Card title="What’s ready">
        <Bullets
          items={[
            <>The <strong>Sign in with Microsoft</strong> button is on the sign-in page (demo for now).</>,
            <>The real Microsoft sign-in is <strong>built and tested up to Microsoft’s page</strong>. Turning it on is one setting, no new code.</>,
            <>It only accepts accounts from <strong>TRU’s own Microsoft tenant</strong>, not personal or other schools’ accounts.</>,
            <>Clear messages when a sign-in is refused (not added yet, or deactivated).</>,
          ]}
        />
        <div className="mt-5">
          <Callout tone="info">
            <strong>Only people added in Admin → People can sign in.</strong> Sign-up is off. PLAR matches the Microsoft account by <strong>email</strong>, so add each person with their TRU email. Roles still come from People, not from Microsoft.
          </Callout>
        </div>
      </Card>

      <Card title="What we need from TRU IT">
        <p className="mb-3 text-[15px] text-label-2">One app registration in TRU&rsquo;s Microsoft Entra ID:</p>
        <Bullets
          items={[
            <><strong>Name:</strong> PLAR Platform. <strong>Accounts:</strong> this organisation only (single tenant).</>,
            <><strong>Redirect URI (Web):</strong> <code className="break-all rounded-xs bg-fill-1 px-1.5 py-0.5 font-mono text-[13.5px]">{REDIRECT_URI}</code></>,
            <><strong>Permissions (delegated):</strong> openid, email, profile, User.Read, with admin consent.</>,
            <><strong>Optional claims (ID token):</strong> <code className="rounded-xs bg-fill-1 px-1.5 py-0.5 font-mono text-[13.5px]">email</code> and <code className="rounded-xs bg-fill-1 px-1.5 py-0.5 font-mono text-[13.5px]">xms_edov</code>, so PLAR can trust the email and match it to People.</>,
            <><strong>Send us:</strong> the Tenant ID, the Application (client) ID and a client secret, with its expiry date.</>,
          ]}
        />
        <div className="mt-5">
          <Callout tone="warning">
            <strong>Share the client secret securely</strong> (not in plain email or chat). An admin types it into the setup command; it&rsquo;s stored only on PLAR&rsquo;s server.
          </Callout>
        </div>
      </Card>

      <Card title="How we switch it on">
        <ol className="space-y-2.5">
          {[
            <><strong>DNS:</strong> Dr. Latif adds <code className="rounded-xs bg-fill-1 px-1.5 py-0.5 font-mono text-[13.5px]">plar-api.airl.ca</code>, then we turn on HTTPS for it.</>,
            <><strong>Enter TRU&rsquo;s values:</strong> run <code className="rounded-xs bg-fill-1 px-1.5 py-0.5 font-mono text-[13.5px]">server/plar-api.sh microsoft</code> and paste the three values.</>,
            <><strong>Go live:</strong> deploy with Microsoft switched on (<code className="rounded-xs bg-fill-1 px-1.5 py-0.5 font-mono text-[13.5px]">PLAR_MICROSOFT=entra</code>).</>,
            <><strong>Test</strong> with one TRU staff account added in People.</>,
            <><strong>Diary the secret&rsquo;s expiry date</strong> and renew it before then, or Microsoft sign-in stops.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-[22px]">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[12px] font-semibold text-accent-ink">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Next: TRU Moodle">
        <p className="mb-3 text-[15px] text-label-2">Proposed, not agreed yet. TRU Moodle uses the same Microsoft accounts, so one TRU sign-in can work for both.</p>
        <Bullets
          items={[
            <><strong>Same identity:</strong> once Microsoft sign-in is live, a student or advisor uses the same TRU account in Moodle and PLAR. No extra password.</>,
            <><strong>Ask the Moodle team about LTI 1.3:</strong> students could open PLAR from their Moodle course and arrive already signed in.</>,
            <><strong>Ask about a read-only Moodle web services token</strong>, only if PLAR needs course or enrolment data (for example, to help advisors give portfolio course access).</>,
            <><strong>Confirm the email format</strong> TRU uses for students and staff in Microsoft, so People matches it.</>,
            <><strong>Agree what PLAR may read from Moodle</strong>, and include it in the privacy review before any real student data.</>,
          ]}
        />
      </Card>
    </div>
  );
}
