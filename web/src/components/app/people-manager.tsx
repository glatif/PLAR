"use client";

import { useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { Check, Copy, KeyRound, LogOut, Plus, Search, Trash2, UserCheck, UserX, X } from "lucide-react";
import { AlertFilled, CheckCircleFilled } from "@/components/ui/filled-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { roleConfigs, type RoleSlug } from "@/lib/roles";
import {
  addPerson,
  deletePerson,
  resetPassword,
  setActive,
  setRoles,
  signOutEverywhere,
  updatePerson,
  type PeopleResult,
} from "@/app/workspace/people-actions";

export type Person = {
  id: string;
  email: string;
  name: string;
  roles: RoleSlug[];
  canSignIn: boolean;
  active: boolean;
  mustChangePassword: boolean;
  lastSignInAt: string | null;
};

export type AdminEvent = { id: string; action: string; at: string; actor: string | null; target: string | null; detail: Record<string, unknown> };

const ROLE_ORDER: RoleSlug[] = ["student", "advisor", "assessor", "manager", "director", "admin"];
type StatusFilter = "all" | "active" | "deactivated" | "no-sign-in";

// Dates depend on the viewer's time zone, so they render only in the browser.
const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function lastSeen(at: string | null) {
  if (!at) return "Never signed in";
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86_400_000);
  if (days < 1) return "Signed in today";
  if (days === 1) return "Signed in yesterday";
  if (days < 30) return `Signed in ${days} days ago`;
  return `Signed in ${new Date(at).toLocaleDateString("en-CA", { day: "numeric", month: "short", year: "numeric" })}`;
}

function status(p: Person): { label: string; tone: "success" | "neutral" | "warning" | "danger" } {
  if (!p.active) return { label: "Deactivated", tone: "danger" };
  if (!p.canSignIn) return { label: "No sign-in", tone: "neutral" };
  if (p.mustChangePassword) return { label: "Choosing a password", tone: "warning" };
  return { label: "Active", tone: "success" };
}

function RoleChip({ role }: { role: RoleSlug }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-fill-1 px-2.5 text-[12px] font-medium text-neutral-chip-ink">
      <span aria-hidden className="size-2 rounded-full" style={{ background: roleConfigs[role].tile }} />
      {roleConfigs[role].label}
    </span>
  );
}

function Avatar({ person, size = "md" }: { person: Person; size?: "md" | "lg" }) {
  const tile = roleConfigs[person.roles[0] ?? "student"].tile;
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", size === "lg" ? "size-12 text-[15px]" : "size-10 text-[13px]", !person.active && "opacity-40")}
      style={{ background: tile }}
    >
      {initials(person.name || person.email)}
    </span>
  );
}

const field =
  "h-11 w-full rounded-sm border border-border-strong bg-surface px-3.5 text-[16px] text-label outline-none transition-[border-color,box-shadow] placeholder:text-label-2 focus:border-accent focus:shadow-[0_0_0_4px_var(--focus-ring)]";

function RolePicker({ selected, onChange, idPrefix, hideLegend }: { selected: RoleSlug[]; onChange: (roles: RoleSlug[]) => void; idPrefix: string; hideLegend?: boolean }) {
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-2 text-[14px] font-[550]"}>Roles</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {ROLE_ORDER.map((role) => {
          const on = selected.includes(role);
          return (
            <label
              key={role}
              htmlFor={`${idPrefix}-${role}`}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 shadow-[inset_0_0_0_1px_var(--separator-strong)] transition-colors",
                on ? "bg-accent-subtle shadow-[inset_0_0_0_1.5px_var(--accent)]" : "hover:bg-surface-2",
              )}
            >
              <input
                id={`${idPrefix}-${role}`}
                type="checkbox"
                name="roles"
                value={role}
                checked={on}
                onChange={(e) => onChange(e.target.checked ? ROLE_ORDER.filter((r) => r === role || selected.includes(r)) : selected.filter((r) => r !== role))}
                className="size-[18px] accent-[#c2550a]"
              />
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: roleConfigs[role].tile }} />
              <span className="text-[14.5px] font-medium">{roleConfigs[role].label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Modal({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; labelledBy: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Open and close the native dialog in step with `open` (it handles focus and Escape).
  const setRef = (node: HTMLDialogElement | null) => {
    ref.current = node;
    if (node && open && !node.open) node.showModal();
    if (node && !open && node.open) node.close();
  };
  return (
    <dialog
      ref={setRef}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-xl bg-surface p-0 text-label shadow-3 backdrop:bg-black/30 backdrop:backdrop-blur-[2px]"
    >
      {open ? (
        <div className="max-h-[calc(100dvh-48px)] overflow-y-auto p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id={labelledBy} className="font-serif text-[24px] font-semibold leading-[30px] tracking-[-0.02em]">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex size-9 items-center justify-center rounded-full text-label-2 hover:bg-fill-1">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-danger-subtle px-3 py-2.5 text-[14px] text-danger">
      <AlertFilled className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

/** A temporary password, shown once, with a copy button. */
function PasswordReveal({ email, password, intro }: { email: string; password: string; intro: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-5 rounded-md bg-success-subtle p-4">
      <p className="flex items-center gap-2 text-[14.5px] font-semibold text-success">
        <CheckCircleFilled className="size-4" />
        {intro}
      </p>
      <p className="mt-2 text-[13.5px] leading-[19px] text-label-2">
        Give these to the person. The password is shown only once; they choose their own when they first sign in.
      </p>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 text-[14px]">
        <dt className="text-label-2">Email</dt>
        <dd className="break-all font-medium">{email}</dd>
        <dt className="text-label-2">Password</dt>
        <dd className="flex items-center gap-2">
          <code className="rounded-xs bg-surface px-2 py-1 font-mono text-[15px] tracking-wide">{password}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(password).then(() => setCopied(true))}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-semibold shadow-1 hover:bg-surface-2"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </dd>
      </dl>
    </div>
  );
}

function AddPersonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [roles, setRolesState] = useState<RoleSlug[]>(["student"]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; password: string } | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    setError(null);
    setDone(null);
    setRolesState(["student"]);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Add a person" labelledBy="add-person-title">
      {done ? (
        <>
          <PasswordReveal email={done.email} password={done.password} intro="Added. They can sign in now." />
          <div className="mt-6 flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </>
      ) : (
        <form
          className="mt-5 space-y-4"
          action={(formData) =>
            start(async () => {
              setError(null);
              const result = await addPerson(formData);
              if (result.ok) setDone({ email: String(formData.get("email")).trim().toLowerCase(), password: result.password ?? "" });
              else setError(result.error);
            })
          }
        >
          <div className="space-y-1.5">
            <label htmlFor="add-name" className="text-[14px] font-[550]">Full name</label>
            <input id="add-name" name="name" required autoComplete="off" className={field} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="add-email" className="text-[14px] font-[550]">Email</label>
            <input id="add-email" name="email" type="email" required autoComplete="off" placeholder="name@tru.ca" className={field} />
          </div>
          <RolePicker selected={roles} onChange={setRolesState} idPrefix="add" />
          <p className="text-[13.5px] leading-[19px] text-label-2">They get a temporary password, shown after you add them, and choose their own at first sign-in.</p>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="neutral" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={pending || roles.length === 0}>
              {pending ? "Adding…" : "Add person"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Section({ title, children, danger }: { title: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={cn("border-t border-separator pt-5", danger && "pb-1")}>
      <h3 className={cn("mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]", danger ? "text-danger" : "text-label-2")}>{title}</h3>
      {children}
    </section>
  );
}

function ManageDialog({ person, onClose, isSelf, onToast }: { person: Person | null; onClose: () => void; isSelf: boolean; onToast: (text: string) => void }) {
  const [roles, setRolesState] = useState<RoleSlug[]>(person?.roles ?? []);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"reset" | "deactivate" | "delete" | null>(null);
  const [pending, start] = useTransition();

  if (!person) return <Modal open={false} onClose={onClose} title="" labelledBy="manage-title">{null}</Modal>;

  const run = (action: (fd: FormData) => Promise<PeopleResult>, fields: Record<string, string | string[]>, success: string, after?: (r: PeopleResult) => void) =>
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("id", person.id);
      for (const [k, v] of Object.entries(fields)) for (const value of [v].flat()) fd.append(k, value);
      const result = await action(fd);
      setConfirm(null);
      if (!result.ok) return setError(result.error);
      after?.(result);
      onToast(success);
    });

  const rolesChanged = roles.join() !== person.roles.join();

  return (
    <Modal open onClose={onClose} title={person.name || person.email} labelledBy="manage-title">
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-label-2">
        <span className="break-all">{person.email}</span>
        <Badge tone={status(person).tone}>{status(person).label}</Badge>
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <div className="mt-6 space-y-5">
        <Section title="Roles">
          <RolePicker selected={roles} onChange={setRolesState} idPrefix={`roles-${person.id}`} hideLegend />
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={!rolesChanged || roles.length === 0 || pending} onClick={() => run(setRoles, { roles }, `Roles updated for ${person.name}`)}>
              Save roles
            </Button>
          </div>
        </Section>

        <Section title="Details">
          <form
            className="grid gap-3 sm:grid-cols-2"
            action={(fd) => run(updatePerson, { name: String(fd.get("name")), email: String(fd.get("email")) }, `Details saved for ${fd.get("name")}`)}
          >
            <div className="space-y-1.5">
              <label htmlFor={`name-${person.id}`} className="text-[13.5px] font-[550]">Full name</label>
              <input id={`name-${person.id}`} name="name" defaultValue={person.name} required className={field} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`email-${person.id}`} className="text-[13.5px] font-[550]">Email</label>
              <input id={`email-${person.id}`} name="email" type="email" defaultValue={person.email} required className={field} />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button size="sm" type="submit" variant="secondary" disabled={pending}>Save details</Button>
            </div>
          </form>
        </Section>

        <Section title="Password and sign-in">
          {password ? (
            <PasswordReveal email={person.email} password={password} intro="Password reset. They've been signed out everywhere." />
          ) : confirm === "reset" ? (
            <div className="rounded-md bg-surface-2 p-4 shadow-[inset_0_0_0_1px_var(--separator)]">
              <p className="text-[14.5px]">Give {person.name} a new temporary password? Their current password stops working and they&rsquo;re signed out everywhere.</p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="neutral" onClick={() => setConfirm(null)}>Cancel</Button>
                <Button size="sm" disabled={pending} onClick={() => run(resetPassword, {}, `Password reset for ${person.name}`, (r) => r.ok && setPassword(r.password ?? null))}>
                  Reset password
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="bordered" onClick={() => setConfirm("reset")}>
                <KeyRound className="size-3.5" />
                {person.canSignIn ? "Reset password" : "Give them a sign-in"}
              </Button>
              <Button size="sm" variant="bordered" disabled={pending || !person.canSignIn} onClick={() => run(signOutEverywhere, {}, `${person.name} is signed out everywhere`)}>
                <LogOut className="size-3.5" />
                Sign out everywhere
              </Button>
            </div>
          )}
        </Section>

        <Section title="Access" danger>
          {confirm === "deactivate" ? (
            <div className="rounded-md bg-danger-subtle p-4">
              <p className="text-[14.5px] text-danger">Deactivate {person.name}? They&rsquo;re signed out at once and can&rsquo;t sign in. Their records stay, and you can reactivate them.</p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="neutral" onClick={() => setConfirm(null)}>Cancel</Button>
                <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(setActive, { active: "false" }, `${person.name} is deactivated`, () => onClose())}>
                  Deactivate
                </Button>
              </div>
            </div>
          ) : confirm === "delete" ? (
            <div className="rounded-md bg-danger-subtle p-4">
              <p className="text-[14.5px] text-danger">Delete {person.name} for good? This can&rsquo;t be undone. Only people with no case records can be deleted.</p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="neutral" onClick={() => setConfirm(null)}>Cancel</Button>
                <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(deletePerson, {}, `${person.name} is deleted`, () => onClose())}>
                  Delete
                </Button>
              </div>
            </div>
          ) : isSelf ? (
            <p className="text-[14px] text-label-2">This is your own account, so you can&rsquo;t deactivate or delete it here.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {person.active ? (
                <Button size="sm" variant="destructive" onClick={() => setConfirm("deactivate")}>
                  <UserX className="size-3.5" />
                  Deactivate
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(setActive, { active: "true" }, `${person.name} is active again`)}>
                  <UserCheck className="size-3.5" />
                  Reactivate
                </Button>
              )}
              <Button size="sm" variant="plain" className="text-danger hover:bg-danger-subtle" onClick={() => setConfirm("delete")}>
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          )}
        </Section>
      </div>
    </Modal>
  );
}

const eventText: Record<string, string> = {
  person_added: "added",
  roles_changed: "changed the roles of",
  password_reset: "reset the password of",
  deactivated: "deactivated",
  reactivated: "reactivated",
  signed_out_everywhere: "signed out on every device:",
  details_changed: "changed the details of",
  person_deleted: "deleted",
};

export function PeopleManager({ people, events, selfId }: { people: Person[]; events: AdminEvent[]; selfId: string }) {
  const mounted = useMounted();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleSlug | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [adding, setAdding] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const managing = people.find((p) => p.id === managingId) ?? null;

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 4000);
  };

  const counts = useMemo(() => Object.fromEntries(ROLE_ORDER.map((r) => [r, people.filter((p) => p.roles.includes(r)).length])) as Record<RoleSlug, number>, [people]);

  const shown = people.filter((p) => {
    const q = query.trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
    if (role !== "all" && !p.roles.includes(role)) return false;
    if (statusFilter === "active" && !(p.active && p.canSignIn)) return false;
    if (statusFilter === "deactivated" && p.active) return false;
    if (statusFilter === "no-sign-in" && p.canSignIn) return false;
    return true;
  });

  const chip = (on: boolean) =>
    cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition-colors", on ? "bg-accent text-on-accent" : "bg-fill-1 hover:bg-fill-2");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">Admin · People</p>
          <h1 className="mt-2 font-serif text-[36px] font-semibold leading-[42px] tracking-[-0.025em]">People</h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-[24px] text-label-2">Add people, change their roles, reset passwords and deactivate accounts. Every change is recorded below.</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Add person
        </Button>
      </header>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <span className="sr-only">Search people</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-label-2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="h-11 w-full rounded-full bg-surface pl-10 pr-4 text-[15px] shadow-[inset_0_0_0_1px_var(--separator-strong)] outline-none placeholder:text-label-2 focus:shadow-[inset_0_0_0_1.5px_var(--accent),0_0_0_4px_var(--focus-ring)]"
            />
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <span className="text-label-2">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-11 rounded-full bg-surface px-4 text-[14px] font-medium shadow-[inset_0_0_0_1px_var(--separator-strong)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--accent)]"
            >
              <option value="all">Everyone</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="no-sign-in">No sign-in</option>
            </select>
          </label>
        </div>
        <div role="group" aria-label="Filter by role" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" aria-pressed={role === "all"} onClick={() => setRole("all")} className={chip(role === "all")}>
            Everyone <span className="tabular-nums opacity-70">{people.length}</span>
          </button>
          {ROLE_ORDER.map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={chip(role === r)}>
              {roleConfigs[r].label} <span className="tabular-nums opacity-70">{counts[r]}</span>
            </button>
          ))}
        </div>
      </div>

      <section aria-label="People" className="card overflow-hidden">
        {shown.length ? (
          <ul>
            {shown.map((p) => {
              const s = status(p);
              return (
                <li key={p.id} className="border-b border-separator last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setManagingId(p.id)}
                    className="flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3.5">
                      <Avatar person={p} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15.5px] font-semibold">{p.name || p.email}</span>
                          {p.id === selfId ? <span className="text-[12px] text-label-2">(you)</span> : null}
                        </span>
                        <span className="block truncate text-[13px] text-label-2">{p.email}</span>
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5 sm:w-[260px] sm:justify-end">
                      {p.roles.map((r) => (
                        <RoleChip key={r} role={r} />
                      ))}
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:w-[190px] sm:flex-col sm:items-end sm:gap-1">
                      <Badge tone={s.tone}>{s.label}</Badge>
                      <span className="text-[12.5px] text-label-2">{mounted && p.canSignIn ? lastSeen(p.lastSignInAt) : " "}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-6 py-12 text-center text-[15px] text-label-2">No one matches. Try another search or filter.</p>
        )}
      </section>

      <section aria-labelledby="changes" className="card p-6">
        <h2 id="changes" className="text-[17px] font-semibold">Recent changes</h2>
        {events.length ? (
          <ul className="mt-4 space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-[14px]">
                <span>
                  <span className="font-semibold">{e.actor ?? "An admin"}</span> {eventText[e.action] ?? e.action}{" "}
                  <span className="font-semibold">{e.target ?? String(e.detail.name || e.detail.email || "someone")}</span>
                </span>
                <span className="text-[12.5px] text-label-2">{mounted ? new Date(e.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : " "}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-label-2">Nothing yet. Changes you make here appear in this list.</p>
        )}
      </section>

      <AddPersonDialog open={adding} onClose={() => setAdding(false)} />
      <ManageDialog key={managingId ?? "none"} person={managing} isSelf={managing?.id === selfId} onClose={() => setManagingId(null)} onToast={showToast} />

      {toast ? (
        <div role="status" className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-md items-center gap-2.5 rounded-full bg-[#1d1d1f] px-5 py-3 text-[14px] font-medium text-white shadow-3">
          <CheckCircleFilled className="size-4 shrink-0 text-[#7ed99a]" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
