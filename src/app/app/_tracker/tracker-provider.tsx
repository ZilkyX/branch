"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

import * as api from "./api-client";
import { ApplicationDetails } from "./application-details";
import { ApplicationDrawer } from "./application-drawer";
import type { ApplicationDraft } from "./application-drawer";
import { STATUS_OPTIONS, localToday, statusValue } from "./applications";
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
const RetryLoadContext = createContext<(() => void) | null>(null);

// Null until today's date and the user's applications have loaded; pages show skeletons.
export function useTracker() {
  return useContext(TrackerContext);
}

// Set only when loading failed, so pages can offer a retry instead of a skeleton.
export function useRetryLoad() {
  return useContext(RetryLoadContext);
}

const subscribeToNothing = () => () => {};

export function TrackerProvider({ children }: { children: ReactNode }) {
  // "Today" comes from the browser so due dates follow the user's timezone, not the server's.
  const today = useSyncExternalStore(subscribeToNothing, localToday, () => null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [tab, setTab] = useState<ApplicationTab>("active");
  const [pagination, setPagination] = useState<Pagination>({ pageIndex: 0, pageSize: 10 });
  const [drawer, setDrawer] = useState<{ open: boolean; application: Application | null }>({
    open: false,
    application: null,
  });
  const [details, setDetails] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    let isCurrent = true;
    api.fetchApplications().then(
      (loaded) => {
        if (isCurrent) setApplications(loaded);
      },
      () => {
        if (isCurrent) setLoadFailed(true);
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  const actions = useMemo<TableActions>(() => {
    const applyLocally = (id: string, patch: Partial<Application>) =>
      setApplications(
        (current) => current?.map((a) => (a.id === id ? { ...a, ...patch } : a)) ?? current,
      );

    // Updates the screen immediately, and puts it back if the server rejects the change.
    const persist = (id: string, patch: Partial<Application>, previous: Partial<Application>) => {
      applyLocally(id, patch);
      api.updateApplication(id, patch).catch(() => {
        applyLocally(id, previous);
        toast.error("Couldn't save that change. Try again.");
      });
    };

    return {
      view: (application) => setDetails({ open: true, id: application.id }),
      edit: (application) => setDrawer({ open: true, application }),
      setStage: (application, stage, outcome = null) => {
        const { id, company } = application;
        const patch = { stage, outcome: stage === "closed" ? (outcome ?? "no_response") : null };
        const previous = { stage: application.stage, outcome: application.outcome };
        persist(id, patch, previous);

        const label = STATUS_OPTIONS.find((option) => option.value === statusValue(patch))?.label;
        toast.success(`Moved ${company} to ${label}.`, {
          action: { label: "Undo", onClick: () => persist(id, previous, patch) },
        });
      },
      delete: (application) => {
        setApplications((current) => current?.filter((a) => a.id !== application.id) ?? current);
        api.deleteApplication(application.id).then(
          () => toast.success(`Deleted ${application.company}.`),
          () => {
            setApplications((current) => (current ? [application, ...current] : current));
            toast.error(`Couldn't delete ${application.company}. Try again.`);
          },
        );
      },
    };
  }, []);

  function retryLoad() {
    setLoadFailed(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  function selectTab(next: ApplicationTab) {
    setTab(next);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function openAdd() {
    setDrawer({ open: true, application: null });
  }

  // The drawer stays open until this finishes, so a failed save doesn't lose what was typed.
  async function saveDraft(draft: ApplicationDraft) {
    const existing = drawer.application;
    try {
      if (existing) {
        const saved = await api.updateApplication(existing.id, draft);
        setApplications((current) => current?.map((a) => (a.id === saved.id ? saved : a)) ?? current);
        toast.success(`Saved ${saved.company}.`);
      } else {
        const created = await api.createApplication(draft);
        setApplications((current) => (current ? [created, ...current] : [created]));
        selectTab(created.stage);
        toast.success(`Added ${created.company}.`);
      }
      setDrawer((current) => ({ ...current, open: false }));
    } catch {
      toast.error("Couldn't save this application. Try again.");
    }
  }

  const tracker =
    today && applications
      ? { today, applications, actions, tab, selectTab, pagination, setPagination, openAdd }
      : null;

  return (
    <TrackerContext.Provider value={tracker}>
      <RetryLoadContext.Provider value={loadFailed ? retryLoad : null}>
        {children}
        {tracker && (
          <>
            <ApplicationDrawer
              open={drawer.open}
              application={drawer.application}
              today={tracker.today}
              onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}
              onSave={saveDraft}
            />
            <ApplicationDetails
              open={details.open}
              application={tracker.applications.find((a) => a.id === details.id) ?? null}
              today={tracker.today}
              onOpenChange={(open) => setDetails((current) => ({ ...current, open }))}
            />
          </>
        )}
        <Toaster position="top-center" />
      </RetryLoadContext.Provider>
    </TrackerContext.Provider>
  );
}
