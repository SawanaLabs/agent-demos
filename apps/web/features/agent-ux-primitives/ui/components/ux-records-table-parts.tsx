import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpIcon, ArrowUpRightIcon } from "lucide-react";

/**
 * Presentational bits for UxRecordsTable — the sortable header cell and
 * the website link cell.
 */

export function HeaderCell({
  icon,
  label,
  onSort,
  sorted,
}: {
  icon?: React.ReactNode;
  label: string;
  onSort?: () => void;
  sorted?: -1 | 0 | 1;
}) {
  return (
    <th className="border-b px-2.5 py-2 font-medium text-[12px] text-muted-foreground">
      <button
        className="flex w-full items-center gap-1.5 text-left hover:text-foreground"
        onClick={onSort}
        type="button"
      >
        {icon}
        <span className="truncate">{label}</span>
        {sorted === undefined ? null : (
          <ArrowUpIcon
            className={cn(
              "size-3 transition-all",
              sorted === 0 && "opacity-0",
              sorted === -1 && "rotate-180"
            )}
          />
        )}
      </button>
    </th>
  );
}

export function WebsiteLink({ website }: { website?: string }) {
  if (!website) {
    return <span className="text-[12px] text-muted-foreground/60">—</span>;
  }
  return (
    <a
      className="inline-flex items-center gap-1 text-[12px] text-foreground underline-offset-2 hover:underline"
      href={`https://${website}`}
      rel="noreferrer"
      target="_blank"
    >
      {website.replace(".example.com", "")}
      <ArrowUpRightIcon className="size-3 text-muted-foreground" />
    </a>
  );
}
