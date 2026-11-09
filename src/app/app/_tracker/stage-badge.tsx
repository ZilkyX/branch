import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

import { OUTCOMES, STATUS_OPTIONS, statusValue } from "./applications";
import type { Application, Outcome } from "./applications";

export type StageTone = "applied" | "interviewing" | "closed" | Outcome;

const BADGE_TONES: Record<StageTone, string> = {
  applied: "border-stage-applied/40 bg-stage-applied/10 text-stage-applied",
  interviewing: "border-stage-interviewing/40 bg-stage-interviewing/10 text-stage-interviewing",
  closed: "border-stage-closed/40 bg-stage-closed/10 text-stage-closed",
  accepted: "border-stage-accepted/40 bg-stage-accepted/10 text-stage-accepted",
  declined: "border-stage-declined/40 bg-stage-declined/10 text-stage-declined",
  rejected: "border-stage-rejected/40 bg-stage-rejected/10 text-stage-rejected",
  withdrawn: "border-stage-withdrawn/40 bg-stage-withdrawn/10 text-stage-withdrawn",
  no_response: "border-stage-closed/40 bg-stage-closed/10 text-stage-closed",
};

const DOT_TONES: Record<StageTone, string> = {
  applied: "bg-stage-applied",
  interviewing: "bg-stage-interviewing",
  closed: "bg-stage-closed",
  accepted: "bg-stage-accepted",
  declined: "bg-stage-declined",
  rejected: "bg-stage-rejected",
  withdrawn: "bg-stage-withdrawn",
  no_response: "bg-stage-closed",
};

export function isStageTone(value: string): value is StageTone {
  return value in DOT_TONES;
}

export function StageDot({ tone }: { tone: StageTone }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT_TONES[tone])} />;
}

export function StageBadge({ application }: { application: Pick<Application, "stage" | "outcome"> }) {
  const { stage, outcome } = application;
  const value = statusValue(application);
  const closedOutcome = OUTCOMES.find((option) => option.value === outcome)?.value;
  const tone: StageTone = stage === "closed" ? (closedOutcome ?? "no_response") : stage;

  return (
    <Badge variant="outline" className={BADGE_TONES[tone]}>
      {STATUS_OPTIONS.find((option) => option.value === value)?.label}
    </Badge>
  );
}
