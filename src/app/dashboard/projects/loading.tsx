import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="space-y-8">
        {/* Search Bar Skeleton */}
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Projects Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>

              <Skeleton className="h-7 w-48" />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((_, idx) => (
                    <Skeleton key={idx} className="h-8 w-8 rounded-full border-2 border-slate-900" />
                  ))}
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
