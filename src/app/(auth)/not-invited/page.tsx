import { Suspense } from "react";
import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Invite only · Branch",
};

export default function NotInvitedPage() {
  return (
    <div className="flex max-w-sm flex-col items-center gap-3 text-center">
      <h1 className="text-xl font-semibold">Branch is invite-only</h1>
      <p className="text-sm text-muted-foreground">
        Your email isn&apos;t on the invite list. Ask the person who shared Branch with you to add
        it, then sign in again.
      </p>
      <Suspense>
        <SignOutButton redirectUrl="/login">
          <Button variant="outline">Sign out</Button>
        </SignOutButton>
      </Suspense>
    </div>
  );
}
