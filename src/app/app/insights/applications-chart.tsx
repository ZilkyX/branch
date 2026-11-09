"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { applicationsOverTime, formatShortDate } from "../_tracker/applications";
import type { Application, ChartRange } from "../_tracker/applications";

const RANGES: { value: ChartRange; label: string }[] = [
  { value: "90d", label: "Last 3 months" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const chartConfig = {
  applications: { label: "Applications", color: "var(--primary)" },
} satisfies ChartConfig;

export function ApplicationsChart({
  applications,
  today,
}: {
  applications: Application[];
  today: string;
}) {
  const [range, setRange] = useState<ChartRange>("90d");
  const data = applicationsOverTime(applications, today, range);
  const total = data.reduce((sum, point) => sum + point.applications, 0);
  const rangeLabel = RANGES.find((r) => r.value === range)?.label.toLowerCase();
  const pointLabel = (date: string) =>
    range === "7d" ? formatShortDate(date) : `Week ending ${formatShortDate(date)}`;
  const summary = `Applications sent, ${rangeLabel}: ${data
    .map((point) => `${pointLabel(point.date)}, ${point.applications}`)
    .join("; ")}.`;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Applications sent</CardTitle>
        <CardDescription className="tabular-nums">
          {total} in the {rangeLabel}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[range]}
            onValueChange={(value) => {
              if (value[0]) setRange(value[0] as ChartRange);
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            {RANGES.map(({ value, label }) => (
              <ToggleGroupItem key={value} value={value}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            items={RANGES}
            value={range}
            onValueChange={(value) => {
              if (value) setRange(value);
            }}
          >
            <SelectTrigger
              className="flex w-40 @[767px]/card:hidden"
              size="sm"
              aria-label="Chart time range"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {RANGES.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="rounded-lg">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div role="img" aria-label={summary}>
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart
              accessibilityLayer={false}
              data={data}
              margin={{ left: 0, right: 12, top: 8 }}
            >
              <defs>
                <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-applications)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-applications)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => formatShortDate(value)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                cursor
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => pointLabel(String(value))}
                  />
                }
              />
              <Area
                dataKey="applications"
                type="linear"
                fill="url(#fillApplications)"
                stroke="var(--color-applications)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
