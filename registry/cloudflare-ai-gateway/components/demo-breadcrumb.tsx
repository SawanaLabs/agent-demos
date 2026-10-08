import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface DemoBreadcrumbProps {
  className?: string;
  title: string;
}

export function DemoBreadcrumb({ className, title }: DemoBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList
        className={cn(
          "text-[11px] text-muted-foreground uppercase tracking-[0.2em]",
          className
        )}
      >
        <BreadcrumbItem>
          <BreadcrumbLink
            aria-label="Back to demos"
            className="-ml-1 inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5 shrink-0" />
            <span>Demo</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-muted-foreground">
          /
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-normal text-muted-foreground">
            {title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
