import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { BranchSidebar } from "./branch-sidebar";
import { TrackerProvider } from "./tracker-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TrackerProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <BranchSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </TrackerProvider>
  );
}
