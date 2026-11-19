// The six PLAR roles: what each is for, what each does and what each can see and do. Shown on the admin's
// Roles and access page, which is meant to be shown to stakeholders: keep it in plain language, with no
// question IDs, source IDs or references to local files. Duties come from the department's PLAR documents;
// the access columns are the platform's proposal.

import type { RoleSlug } from "@/lib/roles";

export type RoleProfile = {
  slug: RoleSlug;
  name: string;
  /** One sentence: why the role exists. */
  purpose: string;
  does: string[];
  access: string[];
  note?: string;
};

export const roleProfiles: RoleProfile[] = [
  {
    slug: "student",
    name: "Student",
    purpose: "Shows what they've learned through work and life experience, to earn university credit for it.",
    does: [
      "Completes the readiness questionnaire and the Advising Report",
      "Pays the fee and signs the Statement of Authenticity",
      "Builds and submits the portfolio, section by section",
      "Takes part in the interview (the Discussion of Learning)",
      "Can ask for an extension, an accommodation or an appeal",
    ],
    access: [
      "Their own case only",
      "Their portfolio, feedback, deadlines and next steps",
      "Their report and result, once the decision is released",
    ],
  },
  {
    slug: "advisor",
    name: "Advisor",
    purpose: "The student's main contact from the first conversation to the credit being recorded. Advisors also book the interviews.",
    does: [
      "Checks the student has room for PLAR credit in their program",
      "Reviews the Advising Report, then handles payment, registration and Moodle access",
      "Sets due dates and reminders, and gives feedback on each section",
      "Runs the final checklist, checks for credit counted twice and verifies the reference letter",
      "Sends the portfolio for approval",
      "Books the interview with the student and both assessors, and connects the call",
      "Logs the report, requests the credit entry and is the first contact for appeals",
    ],
    access: [
      "The students in their own caseload",
      "Portfolios, feedback, tasks and journey for those students",
      "Interview scheduling for their students",
    ],
    note: "There is no separate booking coordinator: advisors book interviews.",
  },
  {
    slug: "assessor",
    name: "Assessor",
    purpose: "Two subject experts assess each portfolio and interview the student. One is the chair and one is the writer.",
    does: [
      "Review and rate the portfolio before the interview, each on their own",
      "Prepare the interview questions together",
      "Run the interview: the chair leads, the writer asks first in each competency",
      "Agree the final ratings and the credit to recommend",
      "The writer drafts the report and the chair reviews it",
      "Keep notes for two years, and flag integrity or wellbeing concerns",
    ],
    access: [
      "Only the portfolios they are assigned to, with the student's program plan",
      "Their own ratings first. The other assessor's ratings appear only after both have submitted",
      "The report for their cases",
    ],
  },
  {
    slug: "manager",
    name: "PLAR Manager",
    purpose: "Runs PLAR day to day and keeps every case moving.",
    does: [
      "Reviews portfolios to see if they're ready for assessment",
      "Approves portfolios for assessment",
      "Chooses the two assessors for each portfolio",
      "Reviews the assessors' reports and sends them back if something needs clarifying",
      "Sends results to the student, in some versions of the process",
    ],
    access: ["Every case", "Approvals, assessor assignment and report review", "Statistics"],
  },
  {
    slug: "director",
    name: "PLAR Director",
    purpose: "Sets PLAR policy and makes the final decision on every credit award.",
    does: [
      "Makes the final decision on credit and releases the result",
      "Settles disagreements between assessors",
      "Handles integrity concerns and appeals",
      "Helps train new assessors",
    ],
    access: ["Every case", "The final decision and its release", "Appeals, including the assessors' notes"],
  },
  {
    slug: "admin",
    name: "Admin",
    purpose: "Keeps the platform running: who can sign in, what role they have, and the settings.",
    does: [
      "Adds people and gives or removes their roles",
      "Collects statistics and exports",
      "Looks after templates and settings",
    ],
    access: ["Every case and every person", "The only role that can give or remove roles", "Platform settings"],
  },
];

/** yes: holds it. part: takes part or gives input. confirm: one of the roles that may hold it, to be confirmed. */
export type Access = "yes" | "part" | "confirm" | null;

export type Capability = { label: string; access: Record<RoleSlug, Access> };

const none: Record<RoleSlug, Access> = { student: null, advisor: null, assessor: null, manager: null, director: null, admin: null };
const cap = (label: string, access: Partial<Record<RoleSlug, Access>>): Capability => ({ label, access: { ...none, ...access } });

export const capabilityGroups: { title: string; rows: Capability[] }[] = [
  {
    title: "Building the portfolio",
    rows: [
      cap("Submit the portfolio and see feedback", { student: "yes", advisor: "part" }),
      cap("Manage a caseload: deadlines, reminders, extensions", { advisor: "yes" }),
      cap("Give feedback on portfolio sections", { advisor: "yes" }),
      cap("Run the final checklist and verify references", { advisor: "yes" }),
    ],
  },
  {
    title: "Approval and the interview",
    rows: [
      cap("Approve the portfolio for assessment", { advisor: "part", manager: "confirm", director: "confirm" }),
      cap("Choose the two assessors", { advisor: "part", manager: "confirm", director: "confirm" }),
      cap("Book the interview and connect the call", { advisor: "yes", student: "part", assessor: "part" }),
    ],
  },
  {
    title: "Assessment and decision",
    rows: [
      cap("See an assigned portfolio", { assessor: "yes" }),
      cap("Rate independently, agree ratings and write the report", { assessor: "yes" }),
      cap("Review the assessors' report", { advisor: "part", manager: "confirm", director: "confirm" }),
      cap("Make the final credit decision and release it", { manager: "confirm", director: "yes" }),
      cap("Handle appeals", { advisor: "part", director: "yes" }),
      cap("Request the credit entry with Records", { advisor: "yes" }),
    ],
  },
  {
    title: "Running the platform",
    rows: [
      cap("See every case", { manager: "yes", director: "yes", admin: "yes" }),
      cap("Statistics and exports", { manager: "part", director: "part", admin: "yes" }),
      cap("Give or remove roles", { admin: "yes" }),
    ],
  },
];

export const otherOffices: { name: string; part: string }[] = [
  { name: "Program Advisors", part: "Create the student's program plan, confirm there's room for PLAR credit and send the updated plan after an award." },
  { name: "Records", part: "Register the student for PLAR and enter the credit awarded." },
  { name: "Accessibility Services", part: "Arrange accommodations, which the assessors are told about." },
  { name: "TRU Counselling", part: "The backup contact for a student in distress." },
  { name: "IT Service Desk", part: "Help with Moodle and passwords." },
];

export const toConfirm: string[] = [
  "Whether the PLAR Manager or the PLAR Director approves a portfolio for assessment, chooses the assessors, reviews the report and sends the result. The department's documents name different roles for these steps.",
  "Who decides which assessor is the chair and which is the writer.",
  "Whether Program Advisors or Records should have read-only access.",
  "Who can edit the question bank, feedback templates and rubric.",
];
