import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { PeopleManager, type AdminEvent, type Person } from "@/components/app/people-manager";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "People" };

// Admin only. Everything is read and changed through database functions that check the admin role.
export default function PeoplePage({ params }: PageProps<"/workspace/[role]/people">) {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-lg bg-fill-1" />}>
      <People params={params} />
    </Suspense>
  );
}

type One<T> = T | T[] | null;
const one = <T,>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function People({ params }: { params: PageProps<"/workspace/[role]/people">["params"] }) {
  const { role } = await params;
  if (role !== "admin") notFound();
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.workspaces.includes("admin")) redirect("/workspace");

  const supabase = await createClient();
  const [{ data: rows, error }, { data: eventRows }] = await Promise.all([
    supabase.rpc("admin_list_people"),
    supabase
      .from("admin_events")
      .select("id, action, created_at, detail, actor:profiles!admin_events_actor_id_fkey(full_name), target:profiles!admin_events_target_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (error) {
    return <p className="card p-6 text-[15px] text-danger">People couldn&rsquo;t be loaded. Try again in a moment.</p>;
  }

  const people: Person[] = (rows ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    name: r.full_name,
    roles: r.roles,
    canSignIn: r.can_sign_in,
    active: r.active,
    mustChangePassword: r.must_change_password,
    lastSignInAt: r.last_sign_in_at,
  }));

  const events: AdminEvent[] = (eventRows ?? []).map((e) => ({
    id: e.id,
    action: e.action,
    at: e.created_at,
    actor: one(e.actor as One<{ full_name: string }>)?.full_name ?? null,
    target: one(e.target as One<{ full_name: string }>)?.full_name ?? null,
    detail: (e.detail ?? {}) as Record<string, unknown>,
  }));

  return <PeopleManager people={people} events={events} selfId={viewer.id} />;
}
