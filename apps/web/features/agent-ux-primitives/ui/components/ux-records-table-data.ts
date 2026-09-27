/**
 * Data + sorting for UxRecordsTable — kept separate so the component
 * file stays focused on the grid interaction.
 */

export type Strength = "strong" | "weak" | "veryweak" | "none";
export type SortKey = "last" | "name" | "strength";

export const STRENGTH: Record<
  Strength,
  { dotClass: string; label: string; rank: number }
> = {
  none: {
    dotClass: "bg-muted-foreground/50",
    label: "No communication",
    rank: 0,
  },
  strong: {
    dotClass: "bg-status-success-500",
    label: "Very strong",
    rank: 3,
  },
  veryweak: {
    dotClass: "bg-status-danger-500",
    label: "Very weak",
    rank: 1,
  },
  weak: {
    dotClass: "bg-status-warning-500",
    label: "Weak",
    rank: 2,
  },
};

export interface RecordRow {
  id: string;
  /** days since last interaction — Infinity when never contacted */
  lastDays: number;
  lastLabel: string;
  name: string;
  strength: Strength;
  website?: string;
}

export const ROWS: RecordRow[] = [
  {
    id: "aurora",
    lastDays: 9,
    lastLabel: "9 days ago",
    name: "Aurora Scoops — Reykjavík",
    strength: "strong",
    website: "aurora-scoops.example.com",
  },
  {
    id: "coral",
    lastDays: 9,
    lastLabel: "9 days ago",
    name: "Coral Coast Sorbet — Honolulu",
    strength: "strong",
    website: "coral-coast.example.com",
  },
  {
    id: "kumo",
    lastDays: 21,
    lastLabel: "3 weeks ago",
    name: "Kumo Creamery — Tokyo",
    strength: "strong",
    website: "kumo-creamery.example.com",
  },
  {
    id: "maple",
    lastDays: 15,
    lastLabel: "15 days ago",
    name: "Maple Orbit — Montréal",
    strength: "weak",
    website: "maple-orbit.example.com",
  },
  {
    id: "sol",
    lastDays: 60,
    lastLabel: "2 months ago",
    name: "Sol y Nieve — Buenos Aires",
    strength: "weak",
    website: "sol-y-nieve.example.com",
  },
  {
    id: "blue-fig",
    lastDays: 400,
    lastLabel: "over 1 year ago",
    name: "Blue Fig Gelato — Florence",
    strength: "veryweak",
    website: "blue-fig.example.com",
  },
  {
    id: "sahara",
    lastDays: 150,
    lastLabel: "5 months ago",
    name: "Sahara Swirl — Marrakech",
    strength: "veryweak",
  },
  {
    id: "cloudberry",
    lastDays: Number.POSITIVE_INFINITY,
    lastLabel: "No contact",
    name: "Cloudberry Cone — Helsinki",
    strength: "none",
    website: "cloudberry-cone.example.com",
  },
];

export function compareRows(a: RecordRow, b: RecordRow, key: SortKey) {
  if (key === "name") {
    return a.name.localeCompare(b.name);
  }
  if (key === "last") {
    return a.lastDays - b.lastDays;
  }
  return STRENGTH[b.strength].rank - STRENGTH[a.strength].rank;
}
