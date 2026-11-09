export type Stage = "applied" | "interviewing" | "closed";

export const STAGES: { value: Stage; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "closed", label: "Closed" },
];

export type Outcome = "no_response" | "rejected" | "withdrawn" | "declined" | "accepted";

export const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "no_response", label: "No response" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "declined", label: "Declined" },
  { value: "accepted", label: "Accepted" },
];

// One dropdown covers both fields, so closing a job and choosing its outcome is a single pick.
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  ...STAGES.filter((stage) => stage.value !== "closed"),
  ...OUTCOMES.map(({ value, label }) => ({ value: `closed:${value}`, label: `Closed: ${label}` })),
];

export function statusValue({ stage, outcome }: Pick<Application, "stage" | "outcome">) {
  return stage === "closed" ? `closed:${outcome ?? "no_response"}` : stage;
}

export const NO_SOURCE = "none";
export const OTHER_SOURCE = "Other";

export const SOURCE_OPTIONS = [
  { value: NO_SOURCE, label: "Not specified" },
  ...["LinkedIn", "Indeed", "Company site", "Referral", OTHER_SOURCE].map((source) => ({
    value: source,
    label: source,
  })),
];

export const INTERVIEW_ROUNDS = [
  "Recruiter call",
  "Technical",
  "Hiring manager",
  "Final round",
  "Other",
].map((round) => ({ value: round, label: round }));

export type Interview = {
  id: string;
  // Local date and time, as a datetime-local input gives it: YYYY-MM-DDTHH:mm.
  startsAt: string;
  round: string;
  location: string | null;
};

export type Application = {
  id: string;
  company: string;
  role: string;
  url: string | null;
  source: string | null;
  sentTo: string | null;
  location: string | null;
  description: string | null;
  stage: Stage;
  outcome: Outcome | null;
  appliedOn: string;
  interviews: Interview[];
};

export type ApplicationTab = "active" | Stage;

export type TableActions = {
  view: (application: Application) => void;
  edit: (application: Application) => void;
  setStage: (application: Application, stage: Stage, outcome?: Outcome | null) => void;
};

const LOOK_AHEAD_DAYS = 7;

// Dates are stored as local YYYY-MM-DD strings, so a due date never shifts with the timezone.
function parseDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(iso: string, days: number) {
  const date = parseDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseDate(iso));
}

export function sortByApplied(applications: Application[]) {
  return [...applications].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
}

export function formatAppliedDate(iso: string, today: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(iso.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(parseDate(iso));
}

export function formatInterviewWhen(startsAt: string, today: string) {
  const date = startsAt.slice(0, 10);
  const diff = daysBetween(today, date);
  const day =
    diff === 0
      ? "Today"
      : diff === 1
        ? "Tomorrow"
        : new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }).format(parseDate(date));
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${startsAt}:00Z`));
  return `${day}, ${time}`;
}

export function meetingUrl(location: string | null) {
  if (!location) return null;
  try {
    const parsed = new URL(location);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function getUpcomingInterviews(
  applications: Application[],
  today: string,
  withinDays = LOOK_AHEAD_DAYS,
) {
  const lastDay = addDays(today, withinDays);
  return applications
    .filter((application) => application.stage !== "closed")
    .flatMap((application) =>
      application.interviews
        .filter((interview) => {
          const date = interview.startsAt.slice(0, 10);
          return date >= today && date <= lastDay;
        })
        .map((interview) => ({
          application,
          interview,
          when: formatInterviewWhen(interview.startsAt, today),
        })),
    )
    .sort((a, b) => a.interview.startsAt.localeCompare(b.interview.startsAt));
}

export function matchesSearch(application: Application, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = [
    application.company,
    application.role,
    application.location,
    application.source,
    application.sentTo,
    application.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return terms.every((term) => text.includes(term));
}

export function sourceBreakdown(applications: Application[]) {
  const listed = SOURCE_OPTIONS.filter((option) => option.value !== NO_SOURCE);
  const groupOf = (source: string | null) =>
    source === null
      ? NO_SOURCE
      : listed.some((option) => option.value === source)
        ? source
        : OTHER_SOURCE;

  return {
    total: applications.length,
    rows: SOURCE_OPTIONS.map(({ value, label }) => ({
      value,
      label,
      count: applications.filter((a) => groupOf(a.source) === value).length,
    })).sort((a, b) => b.count - a.count),
  };
}

export function outcomeBreakdown(applications: Application[]) {
  const closed = applications.filter((a) => a.stage === "closed");
  return {
    total: closed.length,
    rows: OUTCOMES.map(({ value, label }) => ({
      value,
      label,
      count: closed.filter((a) => (a.outcome ?? "no_response") === value).length,
    })),
  };
}

export type ChartRange = "90d" | "30d" | "7d";

export function applicationsOverTime(
  applications: Application[],
  today: string,
  range: ChartRange,
) {
  const step = range === "7d" ? 1 : 7;
  const points = range === "90d" ? 13 : range === "30d" ? 5 : 7;

  return Array.from({ length: points }, (_, index) => {
    const end = addDays(today, -(points - 1 - index) * step);
    const start = addDays(end, -(step - 1));
    return {
      date: end,
      applications: applications.filter((a) => a.appliedOn >= start && a.appliedOn <= end).length,
    };
  });
}

export function getStageCounts(applications: Application[]) {
  return STAGES.map(({ value, label }) => ({
    value,
    label,
    count: applications.filter((a) => a.stage === value).length,
  }));
}

const SAMPLE_SOURCES = ["LinkedIn", "Indeed", "LinkedIn", "Company site"];
const SAMPLE_OUTCOMES: Outcome[] = ["no_response", "rejected", "no_response", "withdrawn", "rejected", "declined"];

// Placeholder rows until the database exists. Replace this function's call in tracker-provider.tsx.
export function createSampleApplications(today: string): Application[] {
  const on = (offset: number) => addDays(today, offset);
  const row = (
    id: string,
    company: string,
    role: string,
    stage: Stage,
    source: string,
    dates: Pick<Application, "appliedOn"> &
      Partial<
        Pick<Application, "interviews" | "location" | "description" | "sentTo">
      >,
  ): Application => ({
    id,
    company,
    role,
    stage,
    outcome: stage === "closed" ? SAMPLE_OUTCOMES[Number(id.replace(/\D/g, "")) % SAMPLE_OUTCOMES.length] : null,
    source,
    url: "https://example.com/careers",
    interviews: [],
    sentTo: null,
    location: null,
    description: null,
    ...dates,
  });

  const olderApplications: [string, string, Stage, number][] = [
    ["Redwood Media", "Frontend Engineer", "applied", -3],
    ["Beacon Payments", "Software Engineer", "applied", -6],
    ["Tideline Maps", "Web Developer", "applied", -8],
    ["Sable Security", "Junior Developer", "applied", -11],
    ["Linden Foods", "Full-Stack Engineer", "applied", -13],
    ["Ember Games", "UI Developer", "closed", -17],
    ["Quarry Data", "React Engineer", "closed", -24],
    ["Meridian Air", "Software Developer", "closed", -27],
    ["Hollis Legal", "Web Engineer", "closed", -33],
    ["Fernway Homes", "Frontend Developer", "closed", -36],
    ["Summit Retail", "Software Engineer", "closed", -38],
    ["Clearwater Labs", "Product Engineer", "closed", -44],
    ["Wren Education", "Frontend Engineer", "closed", -47],
    ["Basalt Systems", "Junior Engineer", "closed", -52],
    ["Marlow Insurance", "Web Developer", "closed", -58],
    ["Oakline Freight", "Software Developer", "closed", -63],
    ["Nimbus Care", "React Developer", "closed", -71],
    ["Pelican Press", "UI Engineer", "closed", -78],
  ];

  return [
    ...olderApplications.map(([company, role, stage, offset], index) =>
      row(`older-${index}`, company, role, stage, SAMPLE_SOURCES[index % SAMPLE_SOURCES.length], {
        appliedOn: on(offset),
      }),
    ),
    row("1", "Harbor Health", "Frontend Engineer", "interviewing", "Referral", {
      appliedOn: on(-16),
      location: "Hybrid, Makati",
      sentTo: "careers@harborhealth.example",
      description: "Build patient-facing web apps with React and TypeScript.",
      interviews: [
        {
          id: "harbor-1",
          startsAt: `${on(1)}T14:00`,
          round: "Technical",
          location: "https://example.com/meet/harbor",
        },
      ],
    }),
    row("2", "Fieldnote", "Product Engineer", "applied", "Company site", {
      appliedOn: on(-9),
    }),
    row("3", "Tallgrass Software", "Full-Stack Developer", "applied", "Greenhouse", {
      appliedOn: on(-19),
    }),
    row("5", "Pinecrest Bank", "Web Developer", "applied", "Lever", {
      appliedOn: on(-4),
    }),
    row("6", "Orbit Studio", "UI Engineer", "interviewing", "Referral", {
      appliedOn: on(-30),
    }),
    row("7", "Verdant Energy", "Software Engineer", "interviewing", "Ashby", {
      appliedOn: on(-21),
      interviews: [
        {
          id: "verdant-1",
          startsAt: `${on(3)}T10:30`,
          round: "Final round",
          location: "12 Solar Way, 4th floor",
        },
      ],
    }),
    row("9", "Cobalt Analytics", "React Developer", "applied", "Greenhouse", {
      appliedOn: on(-15),
    }),
    row("10", "Juniper Travel", "Software Engineer II", "closed", "Lever", {
      appliedOn: on(-40),
    }),
    row("11", "Alder Robotics", "Web Engineer", "applied", "Company site", {
      appliedOn: on(-2),
    }),
  ];
}
