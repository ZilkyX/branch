import type { Metadata } from "next";

import { ModeToggle } from "@/components/mode-toggle";
import { SiteHeader } from "@/components/site-header";

import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard · Branch",
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader title="Dashboard" actions={<ModeToggle />} />
      <DashboardView />
    </>
  );
}
