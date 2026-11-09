import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { StageDot, isStageTone } from "../_tracker/stage-badge";

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          {tone && isStageTone(tone) && <StageDot tone={tone} />}
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/main:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
      <CardFooter className="text-sm text-muted-foreground tabular-nums">{detail}</CardFooter>
    </Card>
  );
}

export function StatCards({
  total,
  appliedThisWeek,
  stages,
}: {
  total: number;
  appliedThisWeek: number;
  stages: { value: string; label: string; count: number }[];
}) {
  const share = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <div className="grid grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <h2 className="sr-only">Application totals</h2>
      <StatCard
        label="Total applications"
        value={total}
        detail={`${appliedThisWeek} in the last 7 days`}
      />
      {stages.map(({ value, label, count }) => (
        <StatCard
          key={value}
          tone={value}
          label={label}
          value={count}
          detail={`${share(count)}% of total`}
        />
      ))}
    </div>
  );
}
