"use client";

import { Skeleton } from "@/components/ui/skeleton";

import {
  STAGES,
  attentionFor,
  getAttentionItems,
  getUpcomingInterviews,
  sortByNextStep,
} from "../_tracker/applications";
import type { Application, ApplicationTab } from "../_tracker/applications";
import { useTracker } from "../_tracker/tracker-provider";
import { ApplicationsTable } from "./applications-table";
import { UpcomingInterviews } from "./upcoming-interviews";

const ALL_TABS: ApplicationTab[] = ["attention", "active", ...STAGES.map((stage) => stage.value)];

export function DashboardView() {
  const tracker = useTracker();

  if (!tracker) {
    return (
      <div aria-busy aria-label="Loading dashboard" className="flex flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { applications, today, tab, selectTab, pagination, setPagination, actions, openAdd } =
    tracker;

  const attention = getAttentionItems(applications, today);
  const inTab = (application: Application, value: ApplicationTab) => {
    if (value === "attention") return attentionFor(application, today) !== null;
    if (value === "active") return application.stage !== "closed";
    return application.stage === value;
  };
  const tabCounts = Object.fromEntries(
    ALL_TABS.map((value) => [value, applications.filter((a) => inTab(a, value)).length]),
  ) as Record<ApplicationTab, number>;

  // Needs attention keeps its urgency order; every other view sorts by next due date.
  const visible =
    tab === "attention"
      ? attention.map((item) => item.application)
      : sortByNextStep(applications.filter((a) => inTab(a, tab)));

  const overdue = attention.filter((item) => item.overdue).length;
  const dueToday = attention.filter((item) => item.order === 0).length;
  const urgency =
    [overdue > 0 && `${overdue} overdue`, dueToday > 0 && `${dueToday} due today`]
      .filter(Boolean)
      .join(", ") || "Nothing due today";

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <p className="px-4 text-sm text-muted-foreground lg:px-6">
            <span className="font-medium text-foreground">{urgency}.</span> Showing sample data
            that resets when you reload.
          </p>
          <UpcomingInterviews
            items={getUpcomingInterviews(applications, today)}
            onOpen={actions.edit}
          />
          <ApplicationsTable
            applications={visible}
            today={today}
            tab={tab}
            tabCounts={tabCounts}
            onTabChange={selectTab}
            pagination={pagination}
            onPaginationChange={setPagination}
            actions={actions}
            onAdd={openAdd}
          />
        </div>
      </div>
    </div>
  );
}
