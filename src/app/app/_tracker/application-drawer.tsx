"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  INTERVIEW_ROUNDS,
  NO_SOURCE,
  OTHER_SOURCE,
  SOURCE_OPTIONS,
} from "./applications";
import type { Application, Interview } from "./applications";

export type ApplicationDraft = Omit<Application, "id">;
type FormErrors = Partial<Record<"company" | "role" | "url" | "appliedOn", string>>;

function normalizeUrl(value: string): { url: string | null; error?: string } {
  if (!value) return { url: null };
  try {
    const parsed = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { url: parsed.href };
    }
  } catch {
    // Falls through to the validation message below.
  }
  return { url: null, error: "Enter a valid link, or leave this empty." };
}

export function ApplicationDrawer({
  open,
  application,
  today,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  application: Application | null;
  today: string;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: ApplicationDraft) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={isMobile ? "down" : "right"}>
      {/* Touch keeps the default so the phone keyboard doesn't jump up on open. */}
      <DrawerContent
        initialFocus={(openType) =>
          openType === "touch" ? true : document.getElementById("company")
        }
      >
        <DrawerHeader className="gap-1">
          <DrawerTitle>{application ? application.company : "Add job"}</DrawerTitle>
          <DrawerDescription>
            {application ? application.role : "Save it now and fill in the rest later."}
          </DrawerDescription>
        </DrawerHeader>
        <ApplicationForm
          key={application?.id ?? "new"}
          application={application}
          today={today}
          onSave={onSave}
        />
      </DrawerContent>
    </Drawer>
  );
}

function ApplicationForm({
  application,
  today,
  onSave,
}: {
  application: Application | null;
  today: string;
  onSave: (draft: ApplicationDraft) => void;
}) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [interviews, setInterviews] = useState<Interview[]>(application?.interviews ?? []);
  const [showInterviewErrors, setShowInterviewErrors] = useState(false);
  const savedSource = application?.source ?? null;
  const isListedSource = SOURCE_OPTIONS.some((option) => option.value === savedSource);
  const [sourceChoice, setSourceChoice] = useState(
    savedSource === null ? NO_SOURCE : isListedSource ? savedSource : OTHER_SOURCE,
  );

  function addInterview() {
    setInterviews((current) => [
      ...current,
      { id: crypto.randomUUID(), startsAt: "", round: INTERVIEW_ROUNDS[0].value, location: null },
    ]);
  }

  function updateInterview(id: string, patch: Partial<Interview>) {
    setInterviews((current) => current.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();

    const company = text("company");
    const role = text("role");
    const link = normalizeUrl(text("url"));
    const appliedOn = text("appliedOn");
    const source =
      sourceChoice === NO_SOURCE
        ? null
        : sourceChoice === OTHER_SOURCE
          ? text("sourceOther") || OTHER_SOURCE
          : sourceChoice;

    const nextErrors: FormErrors = {
      company: company ? undefined : "Enter the company name.",
      role: role ? undefined : "Enter the role.",
      url: link.error,
      appliedOn: !appliedOn
        ? "Enter the date you applied."
        : appliedOn > today
          ? "The date applied can't be in the future."
          : undefined,
    };
    setErrors(nextErrors);
    const hasMissingTime = interviews.some((interview) => !interview.startsAt);
    setShowInterviewErrors(hasMissingTime);
    if (Object.values(nextErrors).some(Boolean) || hasMissingTime) {
      const fieldOrder = ["company", "role", "appliedOn", "url"] as const;
      const firstInvalid =
        fieldOrder.find((name) => nextErrors[name]) ??
        `interview-${interviews.find((interview) => !interview.startsAt)?.id}-startsAt`;
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    const currentStage = application?.stage ?? "applied";

    onSave({
      company,
      role,
      url: link.url,
      location: text("location") || null,
      source,
      sentTo: text("sentTo") || null,
      description: text("description") || null,
      outcome: application?.outcome ?? null,
      // Having an interview means the job has moved past Applied.
      stage: currentStage === "applied" && interviews.length > 0 ? "interviewing" : currentStage,
      interviews: [...interviews].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      appliedOn,
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 text-sm">
        <Field
          name="company"
          label="Company name"
          placeholder="Acme Inc."
          error={errors.company}
          defaultValue={application?.company}
        />
        <Field
          name="role"
          label="Role"
          placeholder="Frontend Developer"
          error={errors.role}
          defaultValue={application?.role}
        />
        <Field
          name="location"
          label="Location (optional)"
          placeholder="Manila, Remote, Hybrid"
          defaultValue={application?.location ?? ""}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source">Source (optional)</Label>
          <Select
            items={SOURCE_OPTIONS}
            value={sourceChoice}
            onValueChange={(value) => {
              if (value) setSourceChoice(value);
            }}
          >
            <SelectTrigger id="source" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SOURCE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {sourceChoice === OTHER_SOURCE && (
          <Field
            name="sourceOther"
            label="Where did you find it?"
            placeholder="Job fair, Facebook group, a friend"
            defaultValue={savedSource !== OTHER_SOURCE && !isListedSource ? (savedSource ?? "") : ""}
          />
        )}
        <Field
          name="sentTo"
          label="Sent to (optional)"
          placeholder="hr@company.com or careers site"
          defaultValue={application?.sentTo ?? ""}
        />
        <Field
          name="appliedOn"
          label="Date applied"
          type="date"
          max={today}
          error={errors.appliedOn}
          defaultValue={application?.appliedOn ?? today}
        />
        <Field
          name="url"
          label="Job link (optional)"
          placeholder="https://company.com/careers/123"
          error={errors.url}
          inputMode="url"
          defaultValue={application?.url ?? ""}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Role description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            className="min-h-24 select-text"
            placeholder="Paste the job posting or its key responsibilities"
            defaultValue={application?.description ?? ""}
          />
        </div>
        {application && (
          <div className="flex flex-col gap-4 border-t pt-4">
            <div role="group" aria-labelledby="interviews-heading" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 id="interviews-heading" className="font-medium">
                  Interviews
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addInterview}>
                  <PlusIcon />
                  Add interview
                </Button>
              </div>
              {interviews.length === 0 && (
                <p className="text-muted-foreground">No interviews scheduled.</p>
              )}
              {interviews.map((interview) => (
                <div key={interview.id} className="flex flex-col gap-3 rounded-lg border p-3">
                  <Field
                    name={`interview-${interview.id}-startsAt`}
                    label="Date and time"
                    type="datetime-local"
                    value={interview.startsAt}
                    error={
                      showInterviewErrors && !interview.startsAt
                        ? "Enter the date and time."
                        : undefined
                    }
                    onChange={(event) =>
                      updateInterview(interview.id, { startsAt: event.target.value })
                    }
                  />
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`interview-${interview.id}-round`}>Round</Label>
                    <Select
                      items={INTERVIEW_ROUNDS}
                      value={interview.round}
                      onValueChange={(value) => {
                        if (value) updateInterview(interview.id, { round: value });
                      }}
                    >
                      <SelectTrigger id={`interview-${interview.id}-round`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {INTERVIEW_ROUNDS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    name={`interview-${interview.id}-location`}
                    label="Meeting link or location (optional)"
                    placeholder="Zoom link or office address"
                    value={interview.location ?? ""}
                    onChange={(event) =>
                      updateInterview(interview.id, { location: event.target.value || null })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                      setInterviews((current) => current.filter((i) => i.id !== interview.id))
                    }
                  >
                    Remove interview
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <DrawerFooter>
        <Button type="submit">{application ? "Save changes" : "Save job"}</Button>
        <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
      </DrawerFooter>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  ...inputProps
}: {
  name: string;
  label: string;
  error?: string;
} & React.ComponentProps<typeof Input>) {
  const errorId = `${name}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
