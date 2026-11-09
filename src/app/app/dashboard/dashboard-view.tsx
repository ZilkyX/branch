"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  STAGES,
  getUpcomingInterviews,
  matchesSearch,
  sortByApplied,
} from "../_tracker/applications";
import type { Application, ApplicationTab } from "../_tracker/applications";
import { useTracker } from "../_tracker/tracker-provider";
import { ApplicationsTable } from "./applications-table";
import { UpcomingInterviews } from "./upcoming-interviews";

const ALL_TABS: ApplicationTab[] = ["active", ...STAGES.map((stage) => stage.value)];

export function DashboardView() {
  const tracker = useTracker();
  const [search, setSearch] = useState("");

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

  const inTab = (application: Application, value: ApplicationTab) => {
    if (value === "active") return application.stage !== "closed";
    return application.stage === value;
  };
  const matching = applications.filter((a) => matchesSearch(a, search));
  const tabCounts = Object.fromEntries(
    ALL_TABS.map((value) => [value, matching.filter((a) => inTab(a, value)).length]),
  ) as Record<ApplicationTab, number>;

  function changeSearch(value: string) {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  const visible = sortByApplied(matching.filter((a) => inTab(a, tab)));

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <p className="px-4 text-sm text-muted-foreground lg:px-6">
            Showing sample data that resets when you reload.
          </p>
          <UpcomingInterviews
            items={getUpcomingInterviews(applications, today)}
            onOpen={actions.view}
          />
          <h2 className="sr-only">Applications</h2>
          <div className="px-4 lg:px-6">
            <div className="relative md:max-w-sm">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                aria-label="Search applications"
                placeholder="Search company, role, location..."
                className="pl-8"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
              />
              <p role="status" aria-atomic="true" className="sr-only">
                {search.trim()
                  ? `${visible.length} ${visible.length === 1 ? "application" : "applications"} found in this tab`
                  : ""}
              </p>
            </div>
          </div>
          <ApplicationsTable
            isSearching={search.trim().length > 0}
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
