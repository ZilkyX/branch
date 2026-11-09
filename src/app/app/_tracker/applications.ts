export type Stage = "applied" | "interviewing" | "offer" | "closed";

export const STAGES: { value: Stage; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
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

export function parseStatus(value: string): { stage: Stage; outcome: Outcome | null } {
  if (value.startsWith("closed:")) {
    return { stage: "closed", outcome: value.slice("closed:".length) as Outcome };
  }
  return { stage: value as Stage, outcome: null };
}

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
  stage: Stage;
  outcome: Outcome | null;
  appliedOn: string;
  nextAction: string | null;
  nextActionOn: string | null;
  interviews: Interview[];
};

export type ApplicationTab = "attention" | "active" | Stage;

export type TableActions = {
  edit: (application: Application) => void;
  setStage: (application: Application, stage: Stage, outcome?: Outcome | null) => void;
  markDone: (application: Application) => void;
  followUp: (application: Application) => void;
};

export type AttentionKind = "action" | "no-reply";

export type AttentionItem = {
  application: Application;
  kind: AttentionKind;
  label: string;
  detail: string;
  overdue: boolean;
  order: number;
};

const NO_REPLY_AFTER_DAYS = 14;
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

function days(count: number) {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

function dueLabel(diff: number) {
  if (diff < 0) return `Overdue by ${days(-diff)}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Tomorrow";
  return `In ${days(diff)}`;
}

export function attentionFor(application: Application, today: string): AttentionItem | null {
  const { stage, nextAction, nextActionOn, appliedOn } = application;
  if (stage === "closed") return null;

  if (nextAction && nextActionOn) {
    const diff = daysBetween(today, nextActionOn);
    const isLiveProcess = stage === "interviewing" || stage === "offer";
    if (diff <= 0 || (isLiveProcess && diff <= LOOK_AHEAD_DAYS)) {
      return {
        application,
        kind: "action",
        label: dueLabel(diff),
        detail: nextAction,
        overdue: diff < 0,
        order: diff,
      };
    }
  }

  if (stage === "applied" && !nextAction) {
    const waited = daysBetween(appliedOn, today);
    if (waited >= NO_REPLY_AFTER_DAYS) {
      return {
        application,
        kind: "no-reply",
        label: `No reply for ${days(waited)}`,
        detail: "Follow up or close this one",
        overdue: false,
        order: Number.MAX_SAFE_INTEGER - waited,
      };
    }
  }

  return null;
}

export function getAttentionItems(applications: Application[], today: string) {
  return applications
    .map((application) => attentionFor(application, today))
    .filter((item): item is AttentionItem => item !== null)
    .sort((a, b) => a.order - b.order);
}

export function sortByNextStep(applications: Application[]) {
  return [...applications].sort((a, b) => {
    const aDate = a.nextActionOn;
    const bDate = b.nextActionOn;
    if (aDate && bDate) return aDate.localeCompare(bDate);
    if (aDate) return -1;
    if (bDate) return 1;
    return 0;
  });
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

export type DashboardStats = {
  active: number;
  waiting: number;
  appliedThisWeek: number;
  attention: AttentionItem[];
  overdue: number;
  interviewing: number;
  nextInterview: ReturnType<typeof getUpcomingInterviews>[number] | null;
  interviewRate: number;
  atInterview: number;
  totalApplied: number;
};

export function getDashboardStats(applications: Application[], today: string): DashboardStats {
  const count = (stage: Stage) => applications.filter((a) => a.stage === stage).length;
  const attention = getAttentionItems(applications, today);
  const atInterview = count("interviewing") + count("offer");
  const weekStart = addDays(today, -6);

  return {
    active: applications.filter((a) => a.stage !== "closed").length,
    waiting: count("applied"),
    appliedThisWeek: applications.filter((a) => a.appliedOn >= weekStart).length,
    attention,
    overdue: attention.filter((item) => item.overdue).length,
    interviewing: count("interviewing"),
    nextInterview: getUpcomingInterviews(applications, today, 365)[0] ?? null,
    interviewRate:
      applications.length > 0 ? Math.round((atInterview / applications.length) * 100) : 0,
    atInterview,
    totalApplied: applications.length,
  };
}

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
      Partial<Pick<Application, "nextAction" | "nextActionOn" | "interviews">>,
  ): Application => ({
    id,
    company,
    role,
    stage,
    outcome: stage === "closed" ? SAMPLE_OUTCOMES[Number(id.replace(/\D/g, "")) % SAMPLE_OUTCOMES.length] : null,
    source,
    url: "https://example.com/careers",
    nextAction: null,
    nextActionOn: null,
    interviews: [],
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
      row(`older-${index}`, company, role, stage, "Company site", { appliedOn: on(offset) }),
    ),
    row("1", "Harbor Health", "Frontend Engineer", "interviewing", "Referral", {
      appliedOn: on(-16),
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
      nextAction: "Email the recruiter",
      nextActionOn: on(-2),
    }),
    row("3", "Tallgrass Software", "Full-Stack Developer", "applied", "Greenhouse", {
      appliedOn: on(-19),
    }),
    row("5", "Pinecrest Bank", "Web Developer", "applied", "Lever", {
      appliedOn: on(-4),
    }),
    row("6", "Orbit Studio", "UI Engineer", "offer", "Referral", {
      appliedOn: on(-30),
      nextAction: "Reply to the offer",
      nextActionOn: on(4),
    }),
    row("7", "Verdant Energy", "Software Engineer", "interviewing", "Ashby", {
      appliedOn: on(-21),
      nextAction: "Send a thank-you note",
      nextActionOn: on(0),
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
