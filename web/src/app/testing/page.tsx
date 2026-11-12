import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TestingGallery } from "@/components/verification/testing-gallery";
import { aiEnabled } from "@/lib/verification/ai-check";
import { labEnabled, listSessions } from "@/lib/verification/storage";

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

async function Sessions() {
  await connection();
  const sessions = await listSessions();
  return <TestingGallery sessions={sessions} aiEnabled={aiEnabled()} />;
}
