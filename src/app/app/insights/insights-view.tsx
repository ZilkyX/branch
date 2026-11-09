"use client";

import { Skeleton } from "@/components/ui/skeleton";

import {
  addDays,
  getStageCounts,
  outcomeBreakdown,
  sourceBreakdown,
} from "../_tracker/applications";
import { LoadFailed } from "../_tracker/load-failed";
import { useRetryLoad, useTracker } from "../_tracker/tracker-provider";
import { ApplicationsChart } from "./applications-chart";
import { BreakdownCard } from "./breakdown-card";
import { StatCards } from "./stat-cards";

export function InsightsView() {
  const tracker = useTracker();
  const retryLoad = useRetryLoad();
  const sources = sourceBreakdown(tracker?.applications ?? []);
  const outcomes = outcomeBreakdown(tracker?.applications ?? []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        {tracker ? (
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <StatCards
              total={tracker.applications.length}
              appliedThisWeek={
                tracker.applications.filter(
                  (a) => a.appliedOn >= addDays(tracker.today, -6),
                ).length
              }
              stages={getStageCounts(tracker.applications)}
            />
            <div className="px-4 lg:px-6">
              <ApplicationsChart applications={tracker.applications} today={tracker.today} />
            </div>
            <div className="grid gap-4 px-4 md:gap-6 lg:px-6 @3xl/main:grid-cols-2">
              <BreakdownCard
                title="Where applications came from"
                description={`${sources.total} ${sources.total === 1 ? "application" : "applications"}`}
                emptyMessage="Sources appear here once you add an application."
                total={sources.total}
                rows={sources.rows}
              />
              <BreakdownCard
                title="How applications closed"
                description={`${outcomes.total} closed ${outcomes.total === 1 ? "application" : "applications"}`}
                emptyMessage="Outcomes appear here once you close an application."
                total={outcomes.total}
                rows={outcomes.rows}
                showStageDots
              />
            </div>
          </div>
        ) : retryLoad ? (
          <LoadFailed onRetry={retryLoad} />
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
