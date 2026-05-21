"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { cn } from "@workspace/ui/lib/utils";
import { createContext, useContext, useMemo } from "react";

interface HoverCardDelayContextValue {
  closeDelay?: number;
  openDelay?: number;
}

const HoverCardDelayContext = createContext<HoverCardDelayContextValue>({});

type HoverCardProps = PreviewCardPrimitive.Root.Props &
  HoverCardDelayContextValue;

function HoverCard({ closeDelay, openDelay, ...props }: HoverCardProps) {
  const delayContext = useMemo(
    () => ({ closeDelay, openDelay }),
    [closeDelay, openDelay]
  );

  return (
    <HoverCardDelayContext.Provider value={delayContext}>
      <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />
    </HoverCardDelayContext.Provider>
  );
}

function HoverCardTrigger({
  closeDelay,
  delay,
  ...props
}: PreviewCardPrimitive.Trigger.Props) {
  const delayContext = useContext(HoverCardDelayContext);

  return (
    <PreviewCardPrimitive.Trigger
      closeDelay={closeDelay ?? delayContext.closeDelay}
      data-slot="hover-card-trigger"
      delay={delay ?? delayContext.openDelay}
      {...props}
    />
  );
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <PreviewCardPrimitive.Popup
          className={cn(
            "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 z-50 w-64 origin-(--transform-origin) rounded-none bg-popover p-2.5 text-popover-foreground text-xs/relaxed shadow-md outline-hidden ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in",
            className
          )}
          data-slot="hover-card-content"
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
