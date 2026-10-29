import type { RoleSlug } from "@/lib/roles";

// Synthetic preview data only. Never replace with real student information (Resources/docs/16-implementation-plan.md §6).

export type Stat = { label: string; value: string; hint: string };
export type Task = { title: string; meta: string; status: string; tone: "neutral" | "accent" | "success" | "warning"; ai?: boolean };

export const previewData: Record<RoleSlug, { stats: Stat[]; tasks: Task[]; tasksTitle: string }> = {
  student: {
    stats: [
      { label: "Weeks remaining", value: "14", hint: "Due date: 12 March" },
      { label: "Sections drafted", value: "5 of 7", hint: "Evidence listing in progress" },
      { label: "Evidence pieces", value: "19", hint: "Recommended 16–24" },
    ],
    tasksTitle: "Your next steps",
    tasks: [
      { title: "Review advisor feedback on Communication", meta: "Feedback ready · 2 days ago", status: "Ready", tone: "accent" },
      { title: "Add the “why” to 3 evidence captions", meta: "Evidence Description and Listing", status: "To do", tone: "neutral" },
      { title: "Send your next two competencies", meta: "Suggested by week 12", status: "Due soon", tone: "warning" },
    ],
  },
  advisor: {
    stats: [
      { label: "Active students", value: "23", hint: "4 new this month" },
      { label: "Awaiting your review", value: "6", hint: "Oldest: 5 days" },
      { label: "Ready for approval", value: "2", hint: "Checklist complete" },
    ],
    tasksTitle: "Needs your attention",
    tasks: [
      { title: "A. Nguyen · Demonstration of Learning", meta: "Communication & Problem-Solving · first review", status: "Review", tone: "accent", ai: true },
      { title: "S. Patel · Final submission checklist", meta: "2 checks need a look", status: "Checks", tone: "warning" },
      { title: "M. Laurent · Interview scheduling", meta: "Assessors confirmed · student availability pending", status: "Waiting", tone: "neutral" },
    ],
  },
  assessor: {
    stats: [
      { label: "Active assessments", value: "3", hint: "1 as chair, 2 as writer" },
      { label: "Interviews this week", value: "2", hint: "Tue 10:00 · Thu 9:30" },
      { label: "Reports to finalise", value: "1", hint: "Chair review requested" },
    ],
    tasksTitle: "Your assessments",
    tasks: [
      { title: "J. Rivera · Preliminary ratings", meta: "Writer · co-assessor has submitted", status: "Your turn", tone: "accent" },
      { title: "K. Thompson · Interview prep", meta: "Chair · 16 questions selected", status: "Prep", tone: "neutral", ai: true },
      { title: "R. Singh · Report draft", meta: "Writer · draft ready for edits", status: "Draft", tone: "accent", ai: true },
    ],
  },
  admin: {
    stats: [
      { label: "Open cases", value: "41", hint: "Across 6 advisors" },
      { label: "Awaiting approval", value: "4", hint: "2 portfolios · 2 reports" },
      { label: "Median turnaround", value: "19 days", hint: "Interview to result" },
    ],
    tasksTitle: "Approvals",
    tasks: [
      { title: "Approve for assessment · T. Morgan", meta: "Advisor checklist complete", status: "Approve", tone: "accent" },
      { title: "Report review · L. Chen", meta: "Full credit recommended · consistency checks passed", status: "Review", tone: "success" },
      { title: "Assign assessors · P. Okafor", meta: "3 suggested pairs by availability and expertise", status: "Assign", tone: "neutral" },
    ],
  },
};
