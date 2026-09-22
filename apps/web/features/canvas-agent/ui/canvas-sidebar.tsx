"use client";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  BookOpenIcon,
  BoxIcon,
  ImagesIcon,
  LayoutGridIcon,
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";

const destinations = [
  { href: "/demos/canvas-agent", label: "Canvas Agent", icon: WorkflowIcon },
  { href: "/", label: "全部 Demo", icon: LayoutGridIcon },
  {
    href: "/demos/image-workflow-agent",
    label: "图片工作流",
    icon: ImagesIcon,
  },
  { href: "/tools/depth-video", label: "深度视频", icon: BoxIcon },
  { href: "/registry-guide", label: "使用指南", icon: BookOpenIcon },
];

export function CanvasSidebar({
  navigate,
}: {
  navigate: (href: string) => Promise<void>;
}) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center py-2 sm:w-[72px]">
      <nav aria-label="Demo 导航" className="flex flex-col items-center gap-2">
        {destinations.map(({ href, label, icon: Icon }, index) => (
          <div
            className={
              index === 1 || index === 4 ? "mt-2 border-t pt-4" : undefined
            }
            key={href}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={label}
                    className="size-10 rounded-xl sm:size-11"
                    nativeButton={false}
                    render={
                      <Link
                        aria-current={index === 0 ? "page" : undefined}
                        href={href}
                        onNavigate={(event) => {
                          event.preventDefault();
                          if (index !== 0) {
                            void navigate(href);
                          }
                        }}
                      />
                    }
                    role="link"
                    variant={index === 0 ? "secondary" : "ghost"}
                  />
                }
              >
                <Icon className="size-5" />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                {label}
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </nav>
    </aside>
  );
}
