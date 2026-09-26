/**
 * Canned conversation for UxChat — the phase machine steps through
 * sent → reply1 → reply2 → done after each submit.
 */

export type ChatPhase = "idle" | "sent" | "reply1" | "reply2" | "done";

export const TABS = ["Flavors", "Suppliers"] as const;

export interface UxReply {
  body: string;
  label: string;
  sub: string;
  time: string;
}

export const REPLIES: [UxReply, UxReply] = [
  {
    body: "Pulled 3 summers of mint chip sales for comparison.",
    label: "Sales History",
    sub: "Flavor Data",
    time: "4s",
  },
  {
    body: "Mint chip is up 12% with stronger weekend peaks.",
    label: "Comparison",
    sub: "Trend Detection",
    time: "2s",
  },
];
