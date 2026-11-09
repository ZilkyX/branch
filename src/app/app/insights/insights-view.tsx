"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { getDashboardStats } from "../_tracker/applications";
import { useTracker } from "../_tracker/tracker-provider";
import { ApplicationsChart } from "./applications-chart";
import { OutcomeBreakdown } from "./outcome-breakdown";
import { StatCards } from "./stat-cards";

export function InsightsView() {
  const tracker = useTracker();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        {tracker ? (
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <p className="px-4 text-sm text-muted-foreground lg:px-6">
              Showing sample data that resets when you reload.
            </p>
            <StatCards stats={getDashboardStats(tracker.applications, tracker.today)} />
            <div className="px-4 lg:px-6">
              <ApplicationsChart applications={tracker.applications} today={tracker.today} />
            </div>
            <div className="px-4 lg:px-6">
              <OutcomeBreakdown applications={tracker.applications} />
            </div>
          </div>
        ) : (
          <div aria-busy aria-label="Loading insights" className="flex flex-col gap-4 p-4 lg:p-6">
            <div className="grid gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-40 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}
