import { Skeleton } from "@/components/ui/skeleton";

export function FullPageLoader() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-3 p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
