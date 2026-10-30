// Role-specific workspace configuration. Real permissions arrive with RBAC in Milestone 1
// (Resources/docs/16-implementation-plan.md); for now this only drives the preview shell.

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
  MessageSquare,
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
  InboxFilled,
  MessageFilled,
  SlidersFilled,
  UsersFilled,
  VideoFilled,
} from "@/components/ui/filled-icons";

export type RoleSlug = "student" | "advisor" | "assessor" | "admin";

/** Navigation shows the outline icon at rest and swaps to the filled one when the item is selected. */
export type NavItem = { label: string; href?: string; milestone?: string; icon: LucideIcon; iconSelected: FilledIcon };

export type RoleConfig = {
  slug: RoleSlug;
  label: string;
  greeting: string;
  nav: NavItem[];
};

const overview = (slug: RoleSlug): NavItem => ({ label: "Overview", href: `/workspace/${slug}`, icon: House, iconSelected: HomeFilled });

export const roleConfigs: Record<RoleSlug, RoleConfig> = {
  student: {
    slug: "student",
    label: "Student",
    greeting: "Here's where your portfolio stands.",
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
    greeting: "Your caseload at a glance.",
    nav: [
      overview("advisor"),
      { label: "Caseload", milestone: "M1", icon: Users, iconSelected: UsersFilled },
      { label: "Reviews", milestone: "M4", icon: FileText, iconSelected: FileFilled },
      { label: "Comment library", milestone: "M4", icon: BookOpen, iconSelected: BookFilled },
      { label: "Scheduling", milestone: "M3", icon: Calendar, iconSelected: CalendarFilled },
    ],
  },
  assessor: {
    slug: "assessor",
    label: "Assessor",
    greeting: "Your assessments and upcoming interviews.",
    nav: [
      overview("assessor"),
      { label: "Assignments", milestone: "M2", icon: Folder, iconSelected: FolderFilled },
      { label: "Rubric worksheets", milestone: "M2", icon: ClipboardCheck, iconSelected: ClipboardCheckFilled },
      { label: "Interviews", milestone: "M3", icon: Video, iconSelected: VideoFilled },
      { label: "Reports", milestone: "M2", icon: FileText, iconSelected: FileFilled },
    ],
  },
  admin: {
    slug: "admin",
    label: "Manager & Director",
    greeting: "Approvals, decisions and oversight.",
    nav: [
      overview("admin"),
      { label: "Approvals", milestone: "M2", icon: CircleCheck, iconSelected: CheckCircleFilled },
      { label: "All cases", milestone: "M1", icon: Folder, iconSelected: FolderFilled },
      { label: "Insights", milestone: "M5", icon: ChartColumn, iconSelected: ChartFilled },
      { label: "People & roles", milestone: "M1", icon: Users, iconSelected: UsersFilled },
      { label: "Settings", milestone: "M1", icon: SlidersVertical, iconSelected: SlidersFilled },
    ],
  },
};

export const roleSlugs = Object.keys(roleConfigs) as RoleSlug[];

export function isRoleSlug(value: string): value is RoleSlug {
  return value in roleConfigs;
}
