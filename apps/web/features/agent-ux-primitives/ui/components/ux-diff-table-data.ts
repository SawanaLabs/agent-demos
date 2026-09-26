/**
 * Rows + staging for UxDiffTable — the staged timeout chain plays the
 * proposed edit once and rests on the completed diff.
 */

export const STAGE_MS = [800, 1000, 1000];

export interface DiffRow {
  category: string;
  dotClass: string;
  removed: boolean;
  supplier: string;
  title: string;
}

export const ROWS: DiffRow[] = [
  {
    category: "Classic",
    dotClass: "bg-primary",
    removed: true,
    supplier: "aurora-scoops",
    title: "Rocky Road",
  },
  {
    category: "Retro",
    dotClass: "bg-muted-foreground",
    removed: true,
    supplier: "kumo-creamery",
    title: "Bubblegum",
  },
  {
    category: "Classic",
    dotClass: "bg-primary",
    removed: false,
    supplier: "maple-orbit",
    title: "Mint Chip",
  },
];

export const ADDED_ROW: DiffRow = {
  category: "Seasonal",
  dotClass: "bg-status-success-500",
  removed: false,
  supplier: "maple-orbit",
  title: "Pistachio",
};
