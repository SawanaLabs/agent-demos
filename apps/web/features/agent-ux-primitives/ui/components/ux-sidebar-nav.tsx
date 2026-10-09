"use client";

import { cn } from "@workspace/ui/lib/utils";
import { ChevronRightIcon, ChevronsUpDownIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ITEMS,
  type NavChild,
  type NavItem,
  SECTIONS,
} from "./ux-sidebar-nav-data";

/**
 * UxSidebarNav — workspace navigation in miniature.
 *
 * Interaction patterns recreated here:
 * - A sliding pill glides to the hovered (or active) item instead of a
 *   per-item hover state — the highlight belongs to the list.
 * - Click pins the active item; "Suppliers" expands into a nested group
 *   and the pill still tracks focus inside it.
 * - A workspace switcher row frames the nav.
 *
 * Measurement runs after paint against item refs, re-measured via
 * ResizeObserver when the group expands. The nav model lives in
 * `./ux-sidebar-nav-data.ts` — no backend.
 */

export function UxSidebarNav({ className }: { className?: string }) {
  const [active, setActive] = useState("tasks");
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [box, setBox] = useState<{ height: number; top: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const measure = useCallback(() => {
    const container = navRef.current;
    const target = itemRefs.current[hovered ?? active];
    if (!(container && target)) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setBox({
      height: targetRect.height,
      top: targetRect.top - containerRect.top,
    });
  }, [hovered, active]);

  useEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const container = navRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  const renderItem = (item: NavItem | NavChild, depth = 0) => {
    const isActive = item.key === active;
    const icon = "icon" in item ? <item.icon className="size-3.5" /> : null;
    return (
      <button
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative z-10 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
          depth > 0 && "pl-7",
          "children" in item && item.children && "pr-8"
        )}
        key={item.key}
        onBlur={() => setHovered(null)}
        onClick={() => setActive(item.key)}
        onFocus={() => setHovered(item.key)}
        onMouseEnter={() => setHovered(item.key)}
        onMouseLeave={() => setHovered(null)}
        ref={(el) => {
          itemRefs.current[item.key] = el;
        }}
        type="button"
      >
        <span
          className={isActive ? "text-foreground" : "text-muted-foreground"}
        >
          {icon}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] transition-colors",
            isActive ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {item.label}
        </span>
        {"badge" in item && item.badge ? (
          <span
            className={cn(
              "grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 font-semibold text-[10.5px] tabular-nums",
              isActive
                ? "bg-card text-muted-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div
      className={cn("w-56 rounded-xl border bg-card p-2 shadow-sm", className)}
    >
      <button
        className="mb-2 flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-muted"
        type="button"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-semibold text-[13px] text-primary-foreground">
          C
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-[13px] text-foreground leading-tight">
            Creamery Ops
          </span>
          <span className="block truncate text-[11px] text-muted-foreground leading-tight">
            Production workspace
          </span>
        </span>
        <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
      </button>

      <div className="relative flex flex-col gap-2" ref={navRef}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-md bg-muted transition-[top,height,opacity] duration-200"
          style={{
            height: box?.height ?? 0,
            opacity: box ? 1 : 0,
            top: box?.top ?? 0,
          }}
        />
        {SECTIONS.map((section) => (
          <div key={section}>
            <div className="px-2 pt-1 pb-1 font-medium text-[10.5px] text-muted-foreground uppercase tracking-wider">
              {section}
            </div>
            <div className="flex flex-col gap-px">
              {ITEMS.filter((item) => item.section === section).map((item) =>
                item.children ? (
                  <div key={item.key}>
                    <div className="relative">
                      {renderItem(item)}
                      <button
                        aria-expanded={expanded}
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                        className="absolute top-1/2 right-1.5 z-20 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                        onClick={() => setExpanded((value) => !value)}
                        type="button"
                      >
                        <ChevronRightIcon
                          className={cn(
                            "size-3 transition-transform duration-200",
                            expanded && "rotate-90"
                          )}
                        />
                      </button>
                    </div>
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-200"
                      style={{
                        gridTemplateRows: expanded ? "1fr" : "0fr",
                        opacity: expanded ? 1 : 0,
                      }}
                    >
                      <div className="flex flex-col gap-px overflow-hidden">
                        {item.children.map((child) => renderItem(child, 1))}
                      </div>
                    </div>
                  </div>
                ) : (
                  renderItem(item)
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
