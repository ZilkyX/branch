import { z } from "zod";

const STAGE_VALUES = ["applied", "interviewing", "closed"] as const;
const OUTCOME_VALUES = ["no_response", "rejected", "withdrawn", "declined", "accepted"] as const;

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Dates are the user's local date, so allow for time zones ahead of the server.
function latestAllowedDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

const interviewSchema = z.object({
  id: z.string().min(1).max(64),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  round: z.string().trim().min(1).max(50),
  location: optionalText(500),
});

const fields = {
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  // The URL is rendered as a link, so only web addresses are allowed.
  url: z.string().trim().max(2048).refine(isHttpUrl).nullable(),
  location: optionalText(200),
  source: optionalText(100),
  sentTo: optionalText(200),
  description: optionalText(20000),
  stage: z.enum(STAGE_VALUES),
  outcome: z.enum(OUTCOME_VALUES).nullable(),
  appliedOn: z.iso.date().refine((value) => value <= latestAllowedDate()),
  interviews: z.array(interviewSchema).max(30),
};

function hasConsistentOutcome(stage: string, outcome: string | null) {
  return stage === "closed" ? outcome !== null : outcome === null;
}

export const createApplicationSchema = z
  .object({
    company: fields.company,
    role: fields.role,
    appliedOn: fields.appliedOn,
    url: fields.url.default(null),
    location: fields.location.default(null),
    source: fields.source.default(null),
    sentTo: fields.sentTo.default(null),
    description: fields.description.default(null),
    stage: fields.stage.default("applied"),
    outcome: fields.outcome.default(null),
    interviews: fields.interviews.default([]),
  })
  .refine((value) => hasConsistentOutcome(value.stage, value.outcome), {
    path: ["outcome"],
    message: "An outcome is required for closed applications, and only for them.",
  });

// No defaults here: a missing field must stay untouched, not be reset.
export const updateApplicationSchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update." })
  .refine((value) => (value.stage === undefined) === (value.outcome === undefined), {
    path: ["outcome"],
    message: "Stage and outcome must be updated together.",
  })
  .refine(
    (value) =>
      value.stage === undefined ||
      value.outcome === undefined ||
      hasConsistentOutcome(value.stage, value.outcome),
    {
      path: ["outcome"],
      message: "An outcome is required for closed applications, and only for them.",
    },
  );

export type CreateApplicationInput = z.output<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.output<typeof updateApplicationSchema>;
