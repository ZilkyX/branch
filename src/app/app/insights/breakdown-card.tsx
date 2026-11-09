import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { StageDot, isStageTone } from "../_tracker/stage-badge";

export function BreakdownCard({
  title,
  description,
  emptyMessage,
  total,
  rows,
  showStageDots = false,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  total: number;
  rows: { value: string; label: string; count: number }[];
  showStageDots?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription className="tabular-nums">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <dl className="divide-y">
            {rows.map(({ value, label, count }) => (
              <div key={value} className="flex items-center justify-between py-2 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  {showStageDots && isStageTone(value) && <StageDot tone={value} />}
                  {label}
                </dt>
                <dd className="flex gap-4 tabular-nums">
                  <span className="font-medium">{count}</span>
                  <span className="w-10 text-right text-muted-foreground">
                    {Math.round((count / total) * 100)}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
