// Synthetic demo accounts created by supabase/seed.sql on the LOCAL stack only.
// The password is a local development credential and works nowhere else.

export const DEMO_PASSWORD = "plar-demo-2026";

export const demoUsers = {
  student: { email: "student@example.test", name: "Alex Morgan" },
  advisor: { email: "advisor@example.test", name: "Sam Patel" },
  chair: { email: "chair@example.test", name: "Jordan Rivera" },
  writer: { email: "writer@example.test", name: "Kai Thompson" },
  manager: { email: "manager@example.test", name: "Lee Chen" },
  director: { email: "director@example.test", name: "Pat Okafor" },
  admin: { email: "admin@example.test", name: "Robin Admin" },
} as const;

export const demoUserCount = Object.keys(demoUsers).length;
