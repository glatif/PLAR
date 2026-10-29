// Role-specific workspace configuration. Real permissions arrive with RBAC in Milestone 1
// (Resources/docs/16-implementation-plan.md); for now this only drives the preview shell.

export type RoleSlug = "student" | "advisor" | "assessor" | "admin";

export type NavItem = { label: string; href?: string; milestone?: string };

export type RoleConfig = {
  slug: RoleSlug;
  label: string;
  greeting: string;
  nav: NavItem[];
};

export const roleConfigs: Record<RoleSlug, RoleConfig> = {
  student: {
    slug: "student",
    label: "Student",
    greeting: "Here's where your portfolio stands.",
    nav: [
      { label: "Overview", href: "/workspace/student" },
      { label: "My portfolio", milestone: "M4" },
      { label: "Feedback", milestone: "M4" },
      { label: "Interview", milestone: "M3" },
      { label: "Messages", milestone: "M1" },
    ],
  },
  advisor: {
    slug: "advisor",
    label: "Advisor",
    greeting: "Your caseload at a glance.",
    nav: [
      { label: "Overview", href: "/workspace/advisor" },
      { label: "Caseload", milestone: "M1" },
      { label: "Reviews", milestone: "M4" },
      { label: "Comment library", milestone: "M4" },
      { label: "Scheduling", milestone: "M3" },
    ],
  },
  assessor: {
    slug: "assessor",
    label: "Assessor",
    greeting: "Your assessments and upcoming interviews.",
    nav: [
      { label: "Overview", href: "/workspace/assessor" },
      { label: "Assignments", milestone: "M2" },
      { label: "Rubric worksheets", milestone: "M2" },
      { label: "Interviews", milestone: "M3" },
      { label: "Reports", milestone: "M2" },
    ],
  },
  admin: {
    slug: "admin",
    label: "Manager & Director",
    greeting: "Approvals, decisions and oversight.",
    nav: [
      { label: "Overview", href: "/workspace/admin" },
      { label: "Approvals", milestone: "M2" },
      { label: "All cases", milestone: "M1" },
      { label: "Insights", milestone: "M5" },
      { label: "People & roles", milestone: "M1" },
      { label: "Settings", milestone: "M1" },
    ],
  },
};

export const roleSlugs = Object.keys(roleConfigs) as RoleSlug[];

export function isRoleSlug(value: string): value is RoleSlug {
  return value in roleConfigs;
}
