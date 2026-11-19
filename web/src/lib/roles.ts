// One workspace per role: student, advisor (who also books interviews), assessor, PLAR Manager,
// PLAR Director and admin. Row-level security in the database decides what each person can see;
// this file only drives the workspace shell.

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  ChartColumn,
  CircleCheck,
  ClipboardCheck,
  FileText,
  Folder,
  House,
  Inbox,
  KeyRound,
  LockKeyhole,
  ScanFace,
  MessageSquare,
  ShieldCheck,
  SlidersVertical,
  Users,
  Video,
} from "lucide-react";
import {
  type FilledIcon,
  BookFilled,
  CalendarFilled,
  ChartFilled,
  CheckCircleFilled,
  ClipboardCheckFilled,
  FileFilled,
  FolderFilled,
  HomeFilled,
  IdCardFilled,
  InboxFilled,
  KeyFilled,
  LockFilled,
  MessageFilled,
  ShieldCheckFilled,
  SlidersFilled,
  UsersFilled,
  VideoFilled,
} from "@/components/ui/filled-icons";

/** One workspace per role. Advisors also book interviews (no separate coordinator role). */
export type RoleSlug = "student" | "advisor" | "assessor" | "manager" | "director" | "admin";

/** Navigation shows the outline icon at rest and swaps to the filled one when the item is selected. */
export type NavItem = { label: string; href?: string; milestone?: string; icon: LucideIcon; iconSelected: FilledIcon };

export type RoleConfig = {
  slug: RoleSlug;
  label: string;
  greeting: string;
  /** Colour of the role's white-glyph tile. */
  tile: string;
  nav: NavItem[];
};

const overview = (slug: RoleSlug): NavItem => ({ label: "Overview", href: `/workspace/${slug}`, icon: House, iconSelected: HomeFilled });
const allCases: NavItem = { label: "All cases", milestone: "M1", icon: Folder, iconSelected: FolderFilled };
const identityChecks: NavItem = { label: "Identity checks", href: "/testing", icon: ShieldCheck, iconSelected: ShieldCheckFilled };
const insights: NavItem = { label: "Insights", milestone: "M5", icon: ChartColumn, iconSelected: ChartFilled };

export const roleConfigs: Record<RoleSlug, RoleConfig> = {
  student: {
    slug: "student",
    label: "Student",
    greeting: "Here's where your portfolio stands.",
    tile: "#F5761A",
    nav: [
      overview("student"),
      { label: "My portfolio", milestone: "M4", icon: Folder, iconSelected: FolderFilled },
      { label: "Feedback", milestone: "M4", icon: MessageSquare, iconSelected: MessageFilled },
      { label: "Interview", milestone: "M3", icon: Video, iconSelected: VideoFilled },
      { label: "Messages", milestone: "M1", icon: Inbox, iconSelected: InboxFilled },
    ],
  },
  advisor: {
    slug: "advisor",
    label: "Advisor",
    greeting: "Your caseload and interview bookings at a glance.",
    tile: "#5E5CE6",
    nav: [
      overview("advisor"),
      { label: "Caseload", milestone: "M1", icon: Users, iconSelected: UsersFilled },
      { label: "Reviews", milestone: "M4", icon: FileText, iconSelected: FileFilled },
      { label: "Comment library", milestone: "M4", icon: BookOpen, iconSelected: BookFilled },
      { label: "Interview bookings", milestone: "M3", icon: Calendar, iconSelected: CalendarFilled },
    ],
  },
  assessor: {
    slug: "assessor",
    label: "Assessor",
    greeting: "Your assessments and upcoming interviews.",
    tile: "#0F8C82",
    nav: [
      overview("assessor"),
      { label: "Assignments", milestone: "M2", icon: Folder, iconSelected: FolderFilled },
      { label: "Rubric worksheets", milestone: "M2", icon: ClipboardCheck, iconSelected: ClipboardCheckFilled },
      { label: "Interviews", milestone: "M3", icon: Video, iconSelected: VideoFilled },
      { label: "Reports", milestone: "M2", icon: FileText, iconSelected: FileFilled },
    ],
  },
  manager: {
    slug: "manager",
    label: "PLAR Manager",
    greeting: "Approvals, assessor assignments and reports to review.",
    tile: "#2F7FC1",
    nav: [
      overview("manager"),
      { label: "Approvals", milestone: "M2", icon: CircleCheck, iconSelected: CheckCircleFilled },
      { label: "Assign assessors", milestone: "M2", icon: Users, iconSelected: UsersFilled },
      { label: "Reports to review", milestone: "M2", icon: FileText, iconSelected: FileFilled },
      allCases,
      identityChecks,
      insights,
    ],
  },
  director: {
    slug: "director",
    label: "PLAR Director",
    greeting: "Credit decisions, appeals and oversight.",
    tile: "#9A3F7A",
    nav: [
      overview("director"),
      { label: "Credit decisions", milestone: "M2", icon: CircleCheck, iconSelected: CheckCircleFilled },
      { label: "Appeals", milestone: "M5", icon: MessageSquare, iconSelected: MessageFilled },
      allCases,
      identityChecks,
      insights,
    ],
  },
  admin: {
    slug: "admin",
    label: "Admin",
    greeting: "People, roles and settings.",
    tile: "#48484A",
    nav: [
      overview("admin"),
      { label: "Roles & access", href: "/workspace/admin/roles", icon: KeyRound, iconSelected: KeyFilled },
      { label: "People", href: "/workspace/admin/people", icon: Users, iconSelected: UsersFilled },
      { label: "Microsoft sign-in", href: "/workspace/admin/microsoft", icon: LockKeyhole, iconSelected: LockFilled },
      allCases,
      { label: "Test identity check", href: "/verify", icon: ScanFace, iconSelected: IdCardFilled },
      identityChecks,
      insights,
      { label: "Settings", milestone: "M1", icon: SlidersVertical, iconSelected: SlidersFilled },
    ],
  },
};

export const roleSlugs = Object.keys(roleConfigs) as RoleSlug[];

export function isRoleSlug(value: string): value is RoleSlug {
  return value in roleConfigs;
}
