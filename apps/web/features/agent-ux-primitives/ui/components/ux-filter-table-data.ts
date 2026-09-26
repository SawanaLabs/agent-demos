/**
 * Rows + status metadata for UxFilterTable — the component stays a
 * pure render of (status, query) over this fixed dataset.
 */

export type TaskStatus = "done" | "progress" | "todo";

export const STATUS_META: Record<
  TaskStatus,
  { dotClass: string; label: string; pillClass: string }
> = {
  done: {
    dotClass: "bg-status-success-500",
    label: "Completed",
    pillClass:
      "bg-status-success-500/10 text-status-success-600 dark:text-status-success-300",
  },
  progress: {
    dotClass: "bg-status-info-500",
    label: "In Progress",
    pillClass:
      "bg-status-info-500/10 text-status-info-600 dark:text-status-info-300",
  },
  todo: {
    dotClass: "bg-status-warning-500",
    label: "To do",
    pillClass:
      "bg-status-warning-500/10 text-status-warning-600 dark:text-status-warning-300",
  },
};

export interface TaskRow {
  date: string;
  owner: string;
  status: TaskStatus;
  task: string;
}

export const ROWS: TaskRow[] = [
  {
    date: "Dec 03",
    owner: "Mango Moon Gelato",
    status: "todo",
    task: "Restock mango sorbet",
  },
  {
    date: "Sep 22",
    owner: "Kumo Creamery",
    status: "progress",
    task: "Churn black sesame",
  },
  {
    date: "Jan 02",
    owner: "Coral Coast Sorbet",
    status: "todo",
    task: "Print summer menu",
  },
  {
    date: "Nov 08",
    owner: "Maple Orbit",
    status: "progress",
    task: "Taste-test batch 42",
  },
  {
    date: "Apr 14",
    owner: "Aurora Scoops",
    status: "done",
    task: "Order waffle cones",
  },
];
