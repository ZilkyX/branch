"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  FlexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import { cn } from "cn";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  PlusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  OUTCOMES,
  STAGES,
  STATUS_OPTIONS,
  attentionFor,
  daysBetween,
  formatShortDate,
  parseStatus,
  statusValue,
} from "../_tracker/applications";
import type { Application, ApplicationTab, TableActions } from "../_tracker/applications";

const APPLICATION_TABS: { value: ApplicationTab; label: string }[] = [
  { value: "attention", label: "Needs attention" },
  { value: "active", label: "All active" },
  ...STAGES,
];

const EMPTY_MESSAGES: Record<ApplicationTab, string> = {
  attention: "Nothing needs attention. Follow-ups and interviews show up here.",
  active: "No active applications yet.",
  applied: "Nothing is waiting on a reply.",
  interviewing: "No interviews in progress.",
  offer: "No offers yet.",
  closed: "No closed applications.",
};

const features = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, Application>();

function PrimaryAction({
  application,
  today,
  actions,
}: {
  application: Application;
  today: string;
  actions: TableActions;
}) {
  const kind = attentionFor(application, today)?.kind;
  if (!kind) return null;

  const { label, run } = {
    action: { label: "Mark done", run: () => actions.markDone(application) },
    "no-reply": { label: "Follow up", run: () => actions.followUp(application) },
  }[kind];

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={`${label}: ${application.company}`}
      onClick={run}
    >
      {label}
    </Button>
  );
}

function buildColumns(today: string, actions: TableActions, tab: ApplicationTab) {
  return columnHelper.columns([
    columnHelper.accessor("company", {
      id: "company",
      header: "Application",
      enableHiding: false,
      cell: ({ row }) => {
        const application = row.original;
        const attention = attentionFor(application, today);
        const step = attention?.detail ?? application.nextAction;
        const dueOn = application.nextActionOn;
        const dueText = attention?.label ?? (dueOn ? formatShortDate(dueOn) : null);
        const isOverdue = dueOn !== null && daysBetween(today, dueOn) < 0;
        return (
          <div className="max-w-48 whitespace-normal sm:max-w-72">
            <div className="flex items-center gap-1">
              <Button
                variant="link"
                className="tap-target h-auto w-fit p-0 text-left font-medium text-foreground"
                onClick={() => actions.edit(application)}
              >
                {application.company}
              </Button>
              {application.url && (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open job posting for ${application.company}`}
                  className="tap-target inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              )}
            </div>
            <p className="text-muted-foreground">{application.role}</p>
            {step && <p className="text-muted-foreground md:hidden">{step}</p>}
            {dueText && (
              <p
                className={cn(
                  "tabular-nums md:hidden",
                  isOverdue ? "font-medium text-destructive" : "text-muted-foreground",
                )}
              >
                {dueText}
              </p>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("stage", {
      id: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <Select
          items={STATUS_OPTIONS}
          value={statusValue(row.original)}
          onValueChange={(value) => {
            if (!value) return;
            const { stage, outcome } = parseStatus(value);
            actions.setStage(row.original, stage, outcome);
          }}
        >
          <SelectTrigger
            size="sm"
            className={row.original.stage === "closed" ? "w-44" : "w-30"}
            aria-label={`Stage for ${row.original.company}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ),
    }),
    columnHelper.accessor("appliedOn", {
      id: "applied",
      header: "Applied",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatShortDate(row.original.appliedOn)}
        </span>
      ),
    }),
    columnHelper.accessor("nextAction", {
      id: "next",
      header: "Next action",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {attentionFor(row.original, today)?.detail ?? row.original.nextAction ?? "None set"}
        </span>
      ),
    }),
    columnHelper.accessor("nextActionOn", {
      id: "due",
      header: "Due",
      cell: ({ row }) => {
        const dueOn = row.original.nextActionOn;
        const attention = attentionFor(row.original, today);
        const isOverdue = dueOn !== null && daysBetween(today, dueOn) < 0;
        return (
          <span
            className={cn(
              "tabular-nums",
              isOverdue ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {attention?.label ?? (dueOn ? formatShortDate(dueOn) : "None")}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const application = row.original;
        const attention = attentionFor(application, today);
        const showPrimary = tab === "attention";
        return (
          <div className="flex items-center justify-end gap-2 md:gap-1">
            {showPrimary && (
              <PrimaryAction application={application} today={today} actions={actions} />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex size-8 text-muted-foreground data-open:bg-muted"
                  />
                }
              >
                <EllipsisVerticalIcon />
                <span className="sr-only">Actions for {application.company}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => actions.edit(application)}>
                  Edit details
                </DropdownMenuItem>
                {!showPrimary && application.nextAction && (
                  <DropdownMenuItem onClick={() => actions.markDone(application)}>
                    Mark done
                  </DropdownMenuItem>
                )}
                {!showPrimary && attention?.kind === "no-reply" && (
                  <DropdownMenuItem onClick={() => actions.followUp(application)}>
                    Follow up
                  </DropdownMenuItem>
                )}
                {application.stage !== "closed" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Close as</DropdownMenuLabel>
                      {OUTCOMES.map(({ value, label }) => (
                        <DropdownMenuItem
                          key={value}
                          onClick={() => actions.setStage(application, "closed", value)}
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ]);
}

const PAGE_SIZES = [10, 20, 30, 40, 50].map((size) => ({
  label: `${size}`,
  value: `${size}`,
}));

export function ApplicationsTable({
  applications,
  today,
  tab,
  tabCounts,
  onTabChange,
  pagination,
  onPaginationChange,
  actions,
  onAdd,
}: {
  applications: Application[];
  today: string;
  tab: ApplicationTab;
  tabCounts: Record<ApplicationTab, number>;
  onTabChange: (tab: ApplicationTab) => void;
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: Dispatch<SetStateAction<{ pageIndex: number; pageSize: number }>>;
  actions: TableActions;
  onAdd: () => void;
}) {
  const isMobile = useIsMobile();
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const columns = useMemo(() => buildColumns(today, actions, tab), [today, actions, tab]);

  const table = useTable({
    features,
    data: applications,
    columns,
    state: {
      columnVisibility: isMobile
        ? {
            ...columnVisibility,
            applied: false,
            next: false,
            due: false,
            // The action button needs this column's room on a phone.
            ...(tab === "attention" ? { stage: false } : {}),
            // Closed rows only offer Edit there, which tapping the company name already does.
            ...(tab === "closed" ? { actions: false } : {}),
          }
        : columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
  });

  const rows = table.getRowModel().rows;

  return (
    <Tabs
      id="applications"
      value={tab}
      onValueChange={(value) => onTabChange(value as ApplicationTab)}
      className="w-full scroll-mt-16 flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between gap-2 px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          items={APPLICATION_TABS}
          value={tab}
          onValueChange={(value) => {
            if (value) onTabChange(value);
          }}
        >
          <SelectTrigger className="flex w-fit @5xl/main:hidden" size="sm" id="view-selector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {APPLICATION_TABS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label} ({tabCounts[value]})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @5xl/main:flex">
          {APPLICATION_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              {tabCounts[value] > 0 && <Badge variant="secondary">{tabCounts[value]}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <Columns3Icon data-icon="inline-start" />
                Columns
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {table
                  .getAllColumns()
                  .filter((column) => column.accessorFn !== undefined && column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {String(column.columnDef.header)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" onClick={onAdd}>
            <PlusIcon />
            <span className="hidden lg:inline">Add job</span>
            <span className="sr-only lg:hidden">Add job</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value={tab}
        tabIndex={-1}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : <FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="h-28 text-center whitespace-normal">
                    <p className="text-muted-foreground">{EMPTY_MESSAGES[tab]}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground tabular-nums lg:flex">
            {applications.length} {applications.length === 1 ? "application" : "applications"}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                items={PAGE_SIZES}
                value={`${pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {PAGE_SIZES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium tabular-nums">
              Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden size-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
