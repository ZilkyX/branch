import type { Metadata } from "next";

import { ModeToggle } from "@/components/mode-toggle";
import { SiteHeader } from "@/components/site-header";

import { InsightsView } from "./insights-view";

export const metadata: Metadata = {
  title: "Insights · Branch",
};

export default function InsightsPage() {
  return (
    <>
      <SiteHeader title="Insights" actions={<ModeToggle />} />
      <InsightsView />
    </>
  );
}
