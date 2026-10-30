import type { LucideIcon } from "lucide-react";
import {
  Award,
  ClipboardCheck,
  FileCheck,
  FolderUp,
  HeartHandshake,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Video,
  Accessibility,
} from "lucide-react";
import { type FilledIcon, GraduationFilled, LandmarkFilled, UserFilled, UsersFilled } from "@/components/ui/filled-icons";

// Public homepage content. Mirrors the approved feature list (Resources/docs/13-features.md).

export type JourneyStep = { title: string; summary: string; detail: string; icon: LucideIcon; ai?: string };

export const journey: JourneyStep[] = [
  {
    title: "Readiness",
    summary: "Questionnaire and resume check",
    detail: "Students take the readiness questionnaire online and share their Autobiographical Resume. Advisors see the results straight away.",
    icon: ClipboardCheck,
  },
  {
    title: "Portfolio",
    summary: "Guided building",
    detail: "Each section and every piece of evidence lives in one organised workspace, with progress tracking and automatic reminders.",
    icon: FolderUp,
    ai: "Reminders and organisation",
  },
  {
    title: "Feedback",
    summary: "Advisor review",
    detail: "Advisors comment directly on the document. Suggested comments from the department's own library make feedback faster and consistent.",
    icon: MessageSquareText,
    ai: "Suggested comments",
  },
  {
    title: "Interview",
    summary: "Verified and streamed",
    detail: "The Discussion of Learning runs in a secure built-in room, after a quick photo-ID check confirmed by a person.",
    icon: Video,
  },
  {
    title: "Decision",
    summary: "Assessor consensus",
    detail: "Two assessors rate independently on a digital rubric, agree together, and review a drafted report before the Director approves.",
    icon: FileCheck,
    ai: "Evidence map and report draft",
  },
  {
    title: "Credit",
    summary: "Recorded and released",
    detail: "The result is released to the student, and a ready-to-send credit request goes to Records.",
    icon: Award,
  },
];

// Roles show a white filled glyph on a coloured tile (design system: filled icons on tiles).
export type Role = { slug: string; title: string; blurb: string; icon: FilledIcon; tile: string; points: string[] };

export const roles: Role[] = [
  {
    slug: "student",
    title: "Students",
    blurb: "Build your portfolio with clear guidance and always know your next step.",
    icon: UserFilled,
    tile: "#F5761A",
    points: ["Upload sections and evidence in one place", "See feedback the moment it's ready", "Join your interview from your case page"],
  },
  {
    slug: "advisor",
    title: "Advisors",
    blurb: "Spend your time coaching, not chasing files and reminders.",
    icon: GraduationFilled,
    tile: "#5E5CE6",
    points: ["Review and comment in the browser", "Suggested comments from your library", "Automatic checklist checks and reminders"],
  },
  {
    slug: "assessor",
    title: "Assessors",
    blurb: "Everything for an assessment on one screen, with your judgement in charge.",
    icon: UsersFilled,
    tile: "#0F8C82",
    points: ["Digital rubric with private preliminary ratings", "Evidence linked to the exact passage", "Report drafts you edit and approve"],
  },
  {
    slug: "admin",
    title: "Manager & Director",
    blurb: "Clear oversight of every case, approval and decision.",
    icon: LandmarkFilled,
    tile: "#2F7FC1",
    points: ["Approval queues with full context", "Audit trail for every award", "Insights on volumes and turnaround"],
  },
];

export type Commitment = { title: string; body: string; icon: LucideIcon };

export const commitments: Commitment[] = [
  {
    title: "People decide",
    body: "AI never awards credit, rates a competency or messages a student. Every suggestion is labelled and needs a person to accept it.",
    icon: HeartHandshake,
  },
  {
    title: "Never used to train AI",
    body: "We only use AI services whose terms guarantee that student information, assessment material and recordings are not used to train their models.",
    icon: ShieldCheck,
  },
  {
    title: "Private by design",
    body: "Access limited to the people who need it, encryption throughout, ID images deleted promptly and every important action recorded.",
    icon: LockKeyhole,
  },
  {
    title: "Accessible and respectful",
    body: "Designed to WCAG 2.2 AA, with captions, keyboard access and audio-only options, and a calm experience that reflects PLAR's values.",
    icon: Accessibility,
  },
];
