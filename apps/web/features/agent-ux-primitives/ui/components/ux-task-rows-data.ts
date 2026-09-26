/**
 * Scripted task-run data for UxTaskRows — the tick timeline maps each
 * beat of the demo to a row status so the component stays presentational.
 */

export const TICK_MS = [600, 900, 2400, 1400, 2400, 600];

export type RowStatus = "pending" | "running" | "failed" | "done";

export interface TaskDetail {
  label: string;
  meta: string;
}

export interface TaskRow {
  amount: string;
  details: TaskDetail[];
  id: string;
  label: string;
}

export const ROWS: TaskRow[] = [
  {
    amount: "12 suppliers",
    details: [
      { label: "Matched tax and contact IDs", meta: "12/12" },
      { label: "Flagged stale records", meta: "0" },
    ],
    id: "verify",
    label: "Verified vendor records",
  },
  {
    amount: "7 SKUs",
    details: [
      { label: "Reading POS export", meta: "3 files" },
      { label: "Scoring stockout risk", meta: "68%" },
    ],
    id: "index",
    label: "Build reorder task list",
  },
  {
    amount: "2 messages",
    details: [
      { label: "Cone supplier follow-up", meta: "draft" },
      { label: "Pistachio reorder note", meta: "draft" },
    ],
    id: "draft",
    label: "Draft supplier emails",
  },
];

export function statusFor(rowId: string, tick: number): RowStatus {
  if (rowId === "verify") {
    return "done";
  }
  if (rowId === "index") {
    return tick < 2 ? "running" : "done";
  }
  if (tick < 3) {
    return "pending";
  }
  return tick === 3 ? "failed" : "done";
}
