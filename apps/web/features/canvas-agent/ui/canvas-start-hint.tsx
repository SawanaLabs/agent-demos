import type { useCanvasAgent } from "./use-canvas-agent";

export function CanvasStartHint({
  controller,
  ready,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
}) {
  if (
    !ready ||
    controller.busy ||
    controller.graph.nodes.length > 0 ||
    controller.messages.length > 0
  ) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[26rem] bottom-32 hidden w-44 select-none text-primary/75 md:block lg:right-[26.5rem] lg:w-72"
    >
      <p
        className="-rotate-6 text-center text-xl leading-relaxed lg:text-3xl"
        style={{
          fontFamily:
            '"Chalkboard SE", "Segoe Print", "Kaiti SC", "Comic Sans MS", cursive',
        }}
      >
        从这里开始！
      </p>
      <svg
        aria-hidden="true"
        className="mt-2 h-22 w-full overflow-visible lg:h-36"
        fill="none"
        focusable="false"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 288 144"
      >
        <path
          d="M64 9 C26 62 58 116 124 107 C182 99 166 43 139 61 C106 88 191 139 280 111"
          strokeWidth="2.5"
        />
        <path
          d="M68 12 C34 64 63 112 123 110"
          opacity="0.3"
          strokeWidth="1.2"
        />
        <path d="M263 96 Q269 105 282 110 Q269 122 261 129" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
