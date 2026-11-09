"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

import { ApplicationDrawer } from "./application-drawer";
import type { ApplicationDraft } from "./application-drawer";
import { OUTCOMES, createSampleApplications, localToday } from "./applications";
import type { Application, ApplicationTab, TableActions } from "./applications";

type Pagination = { pageIndex: number; pageSize: number };

type Tracker = {
  today: string;
  applications: Application[];
  actions: TableActions;
  tab: ApplicationTab;
  selectTab: (tab: ApplicationTab) => void;
  pagination: Pagination;
  setPagination: Dispatch<SetStateAction<Pagination>>;
  openAdd: () => void;
};

const TrackerContext = createContext<Tracker | null>(null);

// Null until the browser has supplied today's date, while pages show their skeletons.
export function useTracker() {
  return useContext(TrackerContext);
}

const subscribeToNothing = () => () => {};

export function TrackerProvider({ children }: { children: ReactNode }) {
  // "Today" comes from the browser so due dates follow the user's timezone, not the server's.
  const today = useSyncExternalStore(subscribeToNothing, localToday, () => null);

  if (!today) return <TrackerContext.Provider value={null}>{children}</TrackerContext.Provider>;

  return (
    <LoadedTracker today={today} initialApplications={createSampleApplications(today)}>
      {children}
    </LoadedTracker>
  );
}

function LoadedTracker({
  today,
  initialApplications,
  children,
}: {
  today: string;
  initialApplications: Application[];
  children: ReactNode;
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [tab, setTab] = useState<ApplicationTab>("attention");
  const [pagination, setPagination] = useState<Pagination>({ pageIndex: 0, pageSize: 10 });
  const [drawer, setDrawer] = useState<{ open: boolean; application: Application | null }>({
    open: false,
    application: null,
  });

  const actions = useMemo<TableActions>(() => {
    const update = (id: string, change: (a: Application) => Partial<Application>) =>
      setApplications((current) =>
        current.map((a) => (a.id === id ? { ...a, ...change(a) } : a)),
      );

    const toastWithUndo = (
      message: string,
      id: string,
      previous: Partial<Application>,
    ) =>
      toast.success(message, {
        action: { label: "Undo", onClick: () => update(id, () => previous) },
      });

    return {
      edit: (application) => setDrawer({ open: true, application }),
      setStage: (application, stage, outcome = null) => {
        const { id, company, stage: previousStage, outcome: previousOutcome } = application;
        const nextOutcome = stage === "closed" ? (outcome ?? "no_response") : null;
        update(id, () => ({ stage, outcome: nextOutcome }));
        if (nextOutcome) {
          const label = OUTCOMES.find((o) => o.value === nextOutcome)?.label;
          toastWithUndo(`Closed ${company}: ${label}.`, id, {
            stage: previousStage,
            outcome: previousOutcome,
          });
        }
      },
      markDone: ({ id, company, nextAction, nextActionOn }) => {
        update(id, () => ({ nextAction: null, nextActionOn: null }));
        toastWithUndo(`Marked done for ${company}.`, id, { nextAction, nextActionOn });
      },
      followUp: ({ id, company, nextAction, nextActionOn }) => {
        update(id, () => ({ nextAction: "Send a follow-up", nextActionOn: today }));
        toastWithUndo(`Follow-up added for ${company}.`, id, { nextAction, nextActionOn });
      },
    };
  }, [today]);

  function selectTab(next: ApplicationTab) {
    setTab(next);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function openAdd() {
    setDrawer({ open: true, application: null });
  }

  function saveDraft(draft: ApplicationDraft) {
    const existing = drawer.application;
    if (existing) {
      setApplications((current) =>
        current.map((a) => (a.id === existing.id ? { ...a, ...draft } : a)),
      );
      toast.success(`Saved ${draft.company}.`);
    } else {
      setApplications((current) => [
        { ...draft, id: crypto.randomUUID(), source: "Manual" },
        ...current,
      ]);
      selectTab(draft.stage);
      toast.success(`Added ${draft.company}.`);
    }
    setDrawer((current) => ({ ...current, open: false }));
  }

  return (
    <TrackerContext.Provider
      value={{
        today,
        applications,
        actions,
        tab,
        selectTab,
        pagination,
        setPagination,
        openAdd,
      }}
    >
      {children}
      <ApplicationDrawer
        open={drawer.open}
        application={drawer.application}
        today={today}
        onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}
        onSave={saveDraft}
      />
      <Toaster />
    </TrackerContext.Provider>
  );
}
