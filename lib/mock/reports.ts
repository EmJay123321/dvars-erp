import type { Report } from "../types";

export const initialReports: Report[] = [
  {
    id: "rep-001",
    employeeId: "emp-maya",
    text: "Finished the unit 4 assessment pack for the KS3 curriculum. Ready for review — the fixtures in the automated tests are now consistent with the student-facing rubric.",
    createdAt: "2026-08-03T14:12:00.000Z",
    replies: [
      {
        id: "rep-reply-001",
        author: "Sarah Chen",
        role: "Admin",
        text: "Thanks Maya — I'll review this week and will add feedback to the shared folder before Friday.",
        createdAt: "2026-08-04T09:00:00.000Z",
      },
    ],
  },
  {
    id: "rep-002",
    employeeId: "emp-jordan",
    text: "Closed two new school contracts this month. Both signed for the annual membership tier. Handing over onboarding notes to the curriculum team today.",
    createdAt: "2026-08-01T10:30:00.000Z",
    replies: [],
  },
  {
    id: "rep-003",
    employeeId: "emp-priya",
    text: "Completed the refreshed brand kit for client-facing decks. This includes updated logo lockups and the new presentation template used across sales materials.",
    createdAt: "2026-07-28T16:45:00.000Z",
    replies: [],
  },
];
