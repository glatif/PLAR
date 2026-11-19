import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TestingGallery } from "@/components/verification/testing-gallery";
import { aiEnabled } from "@/lib/verification/ai-check";
import { unlockedUntil } from "@/lib/verification/access";
import { labEnabled, listSessions, redactSession } from "@/lib/verification/storage";

export const metadata: Metadata = { title: "Identity checks" };

/** Everything the verification lab has captured, for reviewing, comparing and deleting. */
export default function TestingPage() {
  if (!labEnabled()) notFound();
  return (
    <Suspense fallback={<div className="mx-auto mt-24 size-8 animate-spin rounded-full border-[3px] border-accent border-r-transparent" />}>
      <Sessions />
    </Suspense>
  );
}

// Until the page is unlocked with the password, only the list is sent: names, dates, the AI's match
// percentage and decisions. Photos, video and ID details stay on the server.
async function Sessions() {
  await connection();
  const [sessions, until] = await Promise.all([listSessions(), unlockedUntil()]);
  return <TestingGallery sessions={until ? sessions : sessions.map(redactSession)} aiEnabled={aiEnabled()} unlockedUntil={until} />;
}
