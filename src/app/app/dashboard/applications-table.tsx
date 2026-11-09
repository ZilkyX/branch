"use client";

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  FlexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EllipsisVerticalIcon,
  PlusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
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
import { useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  OUTCOMES,
  STAGES,
  formatAppliedDate,
  statusValue,
} from "../_tracker/applications";
import type { Application, ApplicationTab, TableActions } from "../_tracker/applications";
import { StageBadge } from "../_tracker/stage-badge";

const APPLICATION_TABS: { value: ApplicationTab; label: string }[] = [
  { value: "active", label: "All active" },
  ...STAGES,
];

const OPEN_STAGES = STAGES.filter((stage) => stage.value !== "closed");

const EMPTY_MESSAGES: Record<ApplicationTab, string> = {
  active: "No active applications yet.",
  applied: "Nothing is waiting on a reply.",
  interviewing: "No interviews in progress.",
  closed: "No closed applications.",
};

const features = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, Application>();

function buildColumns(actions: TableActions, today: string) {
  return columnHelper.columns([
    columnHelper.accessor("company", {
      id: "company",
      header: "Company name",
      cell: ({ row }) => (
        <div className="max-w-44 whitespace-normal md:max-w-72">
          <Button
            variant="link"
            className="tap-target h-auto w-fit min-w-0 p-0 text-left font-medium whitespace-normal text-foreground"
          >
            {row.original.company}
          </Button>
          <p className="text-muted-foreground md:hidden">{row.original.role}</p>
          <p className="text-muted-foreground tabular-nums md:hidden">
            Applied {formatAppliedDate(row.original.appliedOn, today)}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("role", {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="block max-w-72 truncate text-muted-foreground" title={row.original.role}>
          {row.original.role}
        </span>
      ),
    }),
    columnHelper.accessor("stage", {
      id: "stage",
      header: "Stage",
      cell: ({ row }) => <StageBadge application={row.original} />,
    }),
    columnHelper.accessor("appliedOn", {
      id: "applied",
      header: "Applied date",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatAppliedDate(row.original.appliedOn, today)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const application = row.original;
        const currentStatus = statusValue(application);
        return (
          // React events bubble out of the menu's portal, so this also covers its items.
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
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
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => actions.edit(application)}>
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Change stage</DropdownMenuLabel>
                  {OPEN_STAGES.filter((stage) => stage.value !== currentStatus).map(
                    ({ value, label }) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => actions.setStage(application, value)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Close as</DropdownMenuLabel>
                  {OUTCOMES.filter(({ value }) => `closed:${value}` !== currentStatus).map(
                    ({ value, label }) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => actions.setStage(application, "closed", value)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuGroup>
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
  isSearching,
}: {
  isSearching: boolean;
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
  const { state: sidebarState } = useSidebar();
  // The sidebar has its own Add job button, so this one only fills in when that's out of view.
  const showAddButton = isMobile || sidebarState === "collapsed";
  const columns = useMemo(() => buildColumns(actions, today), [actions, today]);

  // Rows can disappear (closing the last job on a page), so keep the page in range.
  const lastPageIndex = Math.max(Math.ceil(applications.length / pagination.pageSize) - 1, 0);
  const currentPagination = {
    ...pagination,
    pageIndex: Math.min(pagination.pageIndex, lastPageIndex),
  };

  const table = useTable({
    features,
    data: applications,
    columns,
    // The list is rebuilt on every render, which would otherwise snap back to page 1.
    autoResetPageIndex: false,
    state: {
      // Phones show the role and date under the company name instead.
      columnVisibility: isMobile ? { role: false, applied: false } : {},
      pagination: currentPagination,
    },
    getRowId: (row) => row.id,
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
        {showAddButton && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <PlusIcon />
            <span className="hidden lg:inline">Add job</span>
            <span className="sr-only lg:hidden">Add job</span>
          </Button>
        )}
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
                  // The company name is a button inside the row, so keyboard users get this too.
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => actions.view(row.original)}
                  >
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
                    <p className="text-muted-foreground">
                      {isSearching
                        ? "No matches in this tab. The tab counts show where your matches are."
                        : EMPTY_MESSAGES[tab]}
                    </p>
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
              Page {currentPagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
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
