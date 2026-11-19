// Synthetic demo accounts created by supabase/seed.sql on the hosted dev project (and the local stack).
// They only ever see synthetic data. The full list, with the password, is in harness/DEMO-ACCOUNTS.md.

export const DEMO_PASSWORD = "demo1234";

export type DemoUser = { email: string; name: string; role: string; cases: number; tasks: number };

/** What each demo account should be able to see, per supabase/seed.sql. */
export const demoUsers = {
  student: { email: "student@demo.test", name: "Alex Morgan", role: "student", cases: 1, tasks: 3 },
  advisor: { email: "advisor@demo.test", name: "Sam Patel", role: "advisor", cases: 9, tasks: 12 },
  advisor2: { email: "advisor2@demo.test", name: "Maria Laurent", role: "advisor", cases: 7, tasks: 8 },
  assessor: { email: "assessor@demo.test", name: "Jordan Rivera", role: "assessor", cases: 6, tasks: 3 },
  writer: { email: "writer@demo.test", name: "Kai Thompson", role: "assessor", cases: 6, tasks: 2 },
  manager: { email: "manager@demo.test", name: "Lee Chen", role: "manager", cases: 16, tasks: 20 },
  director: { email: "director@demo.test", name: "Pat Okafor", role: "director", cases: 16, tasks: 20 },
  admin: { email: "admin@demo.test", name: "Robin Admin", role: "admin", cases: 16, tasks: 20 },
} satisfies Record<string, DemoUser>;

export const TOTAL_PROFILES = 23;
