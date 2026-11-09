import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { outcomeBreakdown } from "../_tracker/applications";
import type { Application } from "../_tracker/applications";

export function OutcomeBreakdown({ applications }: { applications: Application[] }) {
  const { total, rows } = outcomeBreakdown(applications);

  return (
    <Card>
      <CardHeader>
        <CardTitle>How applications closed</CardTitle>
        <CardDescription className="tabular-nums">
          {total} closed {total === 1 ? "application" : "applications"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Outcomes appear here once you close an application.
          </p>
        ) : (
          <dl className="divide-y">
            {rows.map(({ value, label, count }) => (
              <div key={value} className="flex items-center justify-between py-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
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
