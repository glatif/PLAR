// Synthetic demo accounts on the hosted dev project (created by supabase/seed.sql).
// The shared password lives in the server-only DEMO_LOGIN_PASSWORD variable, never in code.

export type DemoAccount = { key: string; email: string; name: string; role: string; note: string; tile: string };

export const demoAccountGroups: { label: string; accounts: DemoAccount[] }[] = [
  {
    label: "Students",
    accounts: [{ key: "student", email: "student@demo.test", name: "Alex Morgan", role: "Student", note: "Portfolio in feedback", tile: "#F5761A" }],
  },
  {
    label: "Advisors",
    accounts: [
      { key: "advisor", email: "advisor@demo.test", name: "Sam Patel", role: "Advisor", note: "9 students · books interviews", tile: "#5E5CE6" },
      { key: "advisor2", email: "advisor2@demo.test", name: "Maria Laurent", role: "Advisor", note: "7 students · books interviews", tile: "#5E5CE6" },
    ],
  },
  {
    label: "Assessors",
    accounts: [
      { key: "assessor", email: "assessor@demo.test", name: "Jordan Rivera", role: "Assessor", note: "Chair on 4 cases", tile: "#0F8C82" },
      { key: "writer", email: "writer@demo.test", name: "Kai Thompson", role: "Assessor", note: "Writer on 4 cases", tile: "#0F8C82" },
    ],
  },
  {
    label: "PLAR office",
    accounts: [
      { key: "manager", email: "manager@demo.test", name: "Lee Chen", role: "PLAR Manager", note: "Approvals and assessors", tile: "#2F7FC1" },
      { key: "director", email: "director@demo.test", name: "Pat Okafor", role: "PLAR Director", note: "Final credit decisions", tile: "#9A3F7A" },
      { key: "admin", email: "admin@demo.test", name: "Robin Admin", role: "Admin", note: "People, roles and settings", tile: "#48484A" },
    ],
  },
];

export const demoAccounts = demoAccountGroups.flatMap((g) => g.accounts);
