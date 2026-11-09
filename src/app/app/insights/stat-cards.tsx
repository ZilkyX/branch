import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DashboardStats } from "../_tracker/applications";

function StatCard({
  label,
  value,
  badge,
  headline,
  detail,
}: {
  label: string;
  value: string;
  badge?: string;
  headline: string;
  detail: string;
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {badge && (
          <CardAction>
            <Badge variant="outline">{badge}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 font-medium">{headline}</div>
        <div className="line-clamp-1 text-muted-foreground">{detail}</div>
      </CardFooter>
    </Card>
  );
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const topItem = stats.attention[0];
  const next = stats.nextInterview;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <StatCard
        label="Active applications"
        value={String(stats.active)}
        badge={`+${stats.appliedThisWeek} this week`}
        headline={`${stats.waiting} waiting on a reply`}
        detail={`${stats.atInterview} at interview or offer`}
      />
      <StatCard
        label="Needs attention"
        value={String(stats.attention.length)}
        badge={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
        headline={topItem ? topItem.detail : "Nothing is due"}
        detail={topItem ? `${topItem.label}, ${topItem.application.company}` : "You're caught up"}
      />
      <StatCard
        label="Interviewing"
        value={String(stats.interviewing)}
        headline={next ? `Next: ${next.interview.round}` : "No interviews scheduled"}
        detail={next ? `${next.application.company}, ${next.when}` : "Scheduled interviews appear here"}
      />
      <StatCard
        label="Interview rate"
        value={`${stats.interviewRate}%`}
        headline={`${stats.atInterview} of ${stats.totalApplied} applications`}
        detail="Currently at interview or offer"
      />
    </div>
  );
}
