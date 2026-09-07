import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * Skeleton compositions shaped like this app's three most common data-heavy
 * page layouts (dashboard / table / schedule), used by each portal's
 * `loading.tsx`. Structural resemblance to the real layout — not pixel
 * accuracy — is the goal, so the page doesn't visibly jump once real data
 * arrives.
 */

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-5">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-full min-h-48 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-56 w-full" />
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full max-w-md" />
      <Card className="overflow-hidden">
        <div className="flex flex-col divide-y divide-border">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
