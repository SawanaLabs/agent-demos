// Cast positions and interaction shape adapted from ShipWords, MIT.
// See ../NOTICE.md for the pinned source and license.
export const seats = [
  { id: "backLeft", label: "Back left", x: 14, y: 24, size: 13 },
  { id: "backRight", label: "Back right", x: 43, y: 24, size: 13 },
  { id: "keys", label: "Keys", x: 29, y: 57, size: 14 },
  { id: "lead", label: "Lead", x: 77, y: 25, size: 21 },
  { id: "sax", label: "Sax", x: 77, y: 73, size: 21 },
] as const;

export type SeatId = (typeof seats)[number]["id"];
export type Cast<T> = Partial<Record<SeatId, T>>;
export interface CastPhoto {
  name: string;
  url: string;
}

export const castPresets: { label: string; seats: SeatId[] }[] = [
  { label: "Just me on lead", seats: ["lead"] },
  {
    label: "Whole band",
    seats: ["lead", "sax", "keys", "backLeft", "backRight"],
  },
  { label: "Back row only", seats: ["backLeft", "backRight"] },
];

export function moveCastPhoto<T>(
  cast: Cast<T>,
  from: SeatId,
  to: SeatId
): Cast<T> {
  if (from === to || !cast[from]) {
    return cast;
  }
  const next = { ...cast, [to]: cast[from] };
  if (cast[to]) {
    next[from] = cast[to];
  } else {
    delete next[from];
  }
  return next;
}

export function validateCast<T>(cast: Cast<T>, permission: boolean) {
  if (!Object.values(cast).length) {
    return "photo-required";
  }
  return permission ? null : "permission-required";
}

export type PreviewState = "ready" | "running" | "completed" | "failed";
