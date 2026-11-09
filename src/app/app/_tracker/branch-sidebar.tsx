"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumnIcon,
  CirclePlusIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { SidebarUser, SidebarUserSkeleton } from "./sidebar-user";
import { useTracker } from "./tracker-provider";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/app/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "Insights", href: "/app/insights", icon: <ChartColumnIcon /> },
];

function NavMenu({ pathname }: { pathname: string | null }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={pathname === item.href}
            render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
          >
            {item.icon}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function CurrentNavMenu() {
  return <NavMenu pathname={usePathname()} />;
}

export function BranchSidebar() {
  const tracker = useTracker();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/app/dashboard" />}
            >
              <GitBranchIcon className="size-5!" />
              <span className="text-base font-semibold">Branch</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add job"
                  disabled={!tracker}
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  onClick={() => {
                    setOpenMobile(false);
                    tracker?.openAdd();
                  }}
                >
                  <CirclePlusIcon />
                  <span>Add job</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <Suspense fallback={<NavMenu pathname={null} />}>
              <CurrentNavMenu />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<SidebarUserSkeleton />}>
          <SidebarUser />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
