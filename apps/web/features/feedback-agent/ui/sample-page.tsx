"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  ArrowDownToLine,
  ArrowUpRight,
  ChartNoAxesCombined,
} from "lucide-react";
import { useState } from "react";

export function SamplePage() {
  const [notice, setNotice] = useState("");
  return (
    <Card className="min-h-0 flex-1">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ChartNoAxesCombined size={16} />
          <span>Northstar / Reports</span>
        </div>
        <CardTitle className="mt-6 text-2xl">Your week, at a glance</CardTitle>
        <p className="text-muted-foreground">
          A sample product page. Use Feedback to point at anything you would
          improve.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <label htmlFor="report-name">Report name</label>
            <Input defaultValue="Weekly overview" id="report-name" />
          </div>
          <Button
            id="export-report"
            onClick={() =>
              setNotice(
                "Sample issue: export is unavailable. Use Feedback to report this button."
              )
            }
            variant="outline"
          >
            <ArrowDownToLine size={16} />
            Export report
          </Button>
        </div>
        {notice ? (
          <p aria-live="polite" className="text-muted-foreground text-sm">
            {notice}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Visitors", "12,840", "+12.8%"],
            ["Signups", "642", "+8.2%"],
            ["Conversion", "5.0%", "+0.4%"],
          ].map(([label, value, change]) => (
            <Card key={label} size="sm">
              <CardHeader>
                <p className="text-muted-foreground">{label}</p>
                <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-1 text-muted-foreground">
                <ArrowUpRight size={14} />
                {change} this week
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <p className="text-muted-foreground">
              Visitors over the last seven days
            </p>
          </CardHeader>
          <CardContent>
            <div
              aria-label="Weekly activity bar chart"
              className="flex h-36 items-end gap-3"
              role="img"
            >
              {[35, 58, 43, 75, 62, 88, 70].map((height, index) => (
                <div
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                  key={height}
                  style={{ height: "100%" }}
                >
                  <div
                    className="w-full bg-primary/70"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-muted-foreground">
                    {["M", "T", "W", "T", "F", "S", "S"][index]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
