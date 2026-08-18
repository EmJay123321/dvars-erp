"use client";

import { useState } from "react";
import { useData } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import type { Report } from "@/lib/types";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { IconMessage, IconSend } from "@/components/ui/icons";

function ReplyList({ report }: { report: Report }) {
  if (report.replies.length === 0) {
    return <p className="text-xs text-ink-faint">No replies yet.</p>;
  }
  return (
    <div className="space-y-3">
      {report.replies.map((reply) => (
        <div key={reply.id} className="rounded-xl bg-bg px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={reply.author} size={22} />
            <span className="text-sm font-medium text-ink">{reply.author}</span>
            <span className="text-xs text-ink-faint">{reply.role}</span>
            <span className="ml-auto text-xs text-ink-faint">{formatDateTime(reply.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm text-ink-muted">{reply.text}</p>
        </div>
      ))}
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  const { employees, addReply } = useData();
  const [draft, setDraft] = useState("");
  const [replying, setReplying] = useState(false);
  const author = employees.find((e) => e.id === report.employeeId);

  return (
    <Card>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={author?.name ?? "Unknown"} size={34} />
            <div>
              <p className="font-medium text-ink">{author?.name ?? "Unknown"}</p>
              <p className="text-xs text-ink-faint">{formatDateTime(report.createdAt)}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink">{report.text}</p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Replies
          </p>
          <ReplyList report={report} />
        </div>

        {replying ? (
          <div className="mt-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Write a reply…"
              className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setReplying(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                icon={<IconSend size={14} />}
                disabled={!draft.trim()}
                onClick={() => {
                  addReply(report.id, draft.trim());
                  setDraft("");
                  setReplying(false);
                }}
              >
                Reply
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={() => setReplying(true)}>
              Reply
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SystemReportPage() {
  const { currentUser, reports, addReport } = useData();
  const [draft, setDraft] = useState("");

  const isAdmin = currentUser?.role === "Admin" || currentUser?.role === "Sub-admin";
  const myReports = reports.filter((r) => r.employeeId === currentUser?.id);
  const visibleReports = isAdmin ? reports : myReports;

  return (
    <div className="space-y-4">
      <Card
        title={
          isAdmin
            ? "System Report"
            : "Weekly report to your manager"
        }
      >
        <div className="px-5 pb-5 pt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder={isAdmin ? "Add a memo to the team…" : "What did you work on this week? Anything your manager should know?"}
            className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="mt-2 flex justify-end">
            <Button
              icon={<IconSend size={15} />}
              disabled={!draft.trim()}
              onClick={() => {
                addReport(draft.trim());
                setDraft("");
              }}
            >
              Submit report
            </Button>
          </div>
        </div>
      </Card>

      {visibleReports.length === 0 ? (
        <EmptyState
          icon={<IconMessage size={22} />}
          title={isAdmin ? "No reports submitted yet" : "You haven't submitted a report yet"}
          description={
            isAdmin
              ? "Reports from employees will appear here, ready for a threaded reply."
              : "Write a short summary of your week and send it to your manager."
          }
        />
      ) : (
        <div className="space-y-4">
          {visibleReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
