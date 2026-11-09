"use client";

import {
  CalendarClockIcon,
  CalendarIcon,
  CompassIcon,
  ExternalLinkIcon,
  LinkIcon,
  MapPinIcon,
  SendIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatAppliedDate, formatInterviewWhen, meetingUrl } from "./applications";
import type { Application } from "./applications";
import { StageBadge } from "./stage-badge";

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium wrap-anywhere">
          {children ?? <span className="font-normal text-muted-foreground">Not set</span>}
        </dd>
      </div>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-2 text-sm font-medium">
      {children}
    </h3>
  );
}

function InterviewRow({
  interview,
  company,
  today,
}: {
  interview: Application["interviews"][number];
  company: string;
  today: string;
}) {
  const url = meetingUrl(interview.location);

  return (
    <li className="flex items-center gap-3 p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <CalendarClockIcon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium tabular-nums">{formatInterviewWhen(interview.startsAt, today)}</p>
        <p className="wrap-anywhere text-muted-foreground">
          {interview.round}
          {!url && interview.location ? `, ${interview.location}` : ""}
        </p>
      </div>
      {url && (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          aria-label={`Join ${interview.round} with ${company}`}
          render={<a href={url} target="_blank" rel="noopener noreferrer" />}
        >
          Join
          <ExternalLinkIcon aria-hidden data-icon="inline-end" />
        </Button>
      )}
    </li>
  );
}

export function ApplicationDetails({
  open,
  application,
  today,
  onOpenChange,
}: {
  open: boolean;
  application: Application | null;
  today: string;
  onOpenChange: (open: boolean) => void;
}) {
  const jobUrl = meetingUrl(application?.url ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {application && (
          <>
            <DialogHeader className="flex-row items-start gap-3 border-b p-4 pr-12 sm:p-5 sm:pr-12">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
              >
                {application.company.charAt(0).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-col items-start gap-1.5">
                <DialogTitle className="text-lg leading-tight font-semibold wrap-anywhere">
                  {application.company}
                </DialogTitle>
                <DialogDescription className="wrap-anywhere">{application.role}</DialogDescription>
                <StageBadge application={application} />
              </div>
            </DialogHeader>

            <div
              tabIndex={0}
              role="region"
              aria-label="Application details"
              className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5"
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                <Fact icon={MapPinIcon} label="Location">
                  {application.location}
                </Fact>
                <Fact icon={CompassIcon} label="Source">
                  {application.source}
                </Fact>
                <Fact icon={SendIcon} label="Sent to">
                  {application.sentTo}
                </Fact>
                <Fact icon={CalendarIcon} label="Date applied">
                  {formatAppliedDate(application.appliedOn, today)}
                </Fact>
                <Fact icon={LinkIcon} label="Job link">
                  {jobUrl && (
                    <a
                      href={jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={jobUrl}
                      aria-label={`Open job posting for ${application.company}`}
                      className="tap-target inline-flex max-w-full items-center gap-1 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="truncate">{hostname(jobUrl)}</span>
                      <ExternalLinkIcon aria-hidden className="size-3.5 shrink-0" />
                    </a>
                  )}
                </Fact>
              </dl>

              <section aria-labelledby="details-description-heading">
                <SectionHeading id="details-description-heading">Role description</SectionHeading>
                {application.description ? (
                  <p className="rounded-lg bg-muted/50 p-3 leading-relaxed wrap-anywhere whitespace-pre-wrap">
                    {application.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No description added.</p>
                )}
              </section>

              <section aria-labelledby="details-interviews-heading">
                <SectionHeading id="details-interviews-heading">Interviews</SectionHeading>
                {application.interviews.length === 0 ? (
                  <p className="text-muted-foreground">No interviews scheduled.</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {application.interviews.map((interview) => (
                      <InterviewRow
                        key={interview.id}
                        interview={interview}
                        company={application.company}
                        today={today}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
