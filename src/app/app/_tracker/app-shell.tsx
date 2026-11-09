import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { BranchSidebar } from "./branch-sidebar";
import { TrackerProvider } from "./tracker-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TrackerProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <BranchSidebar />
        <SidebarInset id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TrackerProvider>
  );
}
