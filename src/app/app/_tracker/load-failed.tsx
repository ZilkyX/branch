import { Button } from "@/components/ui/button";

export function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
      <p className="font-medium">Couldn&apos;t load your applications</p>
      <p className="text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
