import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { meetingUrl } from "../_tracker/applications";
import type { Application, getUpcomingInterviews } from "../_tracker/applications";

export function UpcomingInterviews({
  items,
  onOpen,
}: {
  items: ReturnType<typeof getUpcomingInterviews>;
  onOpen: (application: Application) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="upcoming-interviews-heading" className="px-4 lg:px-6">
      <h2 id="upcoming-interviews-heading" className="mb-2 text-sm font-medium">
        Upcoming interviews
      </h2>
      <ul className="divide-y rounded-lg border">
        {items.map(({ application, interview, when }) => {
          const url = meetingUrl(interview.location);
          return (
            <li
              key={interview.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-3 py-2.5 text-sm"
            >
              <span className="w-full font-medium tabular-nums sm:w-48">{when}</span>
              <Button
                variant="link"
                className="tap-target h-auto w-fit p-0 text-left font-medium text-foreground"
                onClick={() => onOpen(application)}
              >
                {application.company}
              </Button>
              <span className="text-muted-foreground">{interview.round}</span>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Join ${interview.round} with ${application.company}`}
                  className="tap-target inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto"
                >
                  Join
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              ) : (
                interview.location && (
                  <span className="min-w-0 truncate text-muted-foreground sm:ml-auto">
                    {interview.location}
                  </span>
                )
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
