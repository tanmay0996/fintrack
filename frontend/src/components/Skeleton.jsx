const Skeleton = ({ className = "" }) => (
  <div className={`shimmer rounded-lg ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl p-6 space-y-3" style={{ background: "oklch(0.115 0.022 265)" }}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="rounded-2xl p-6 space-y-4" style={{ background: "oklch(0.115 0.022 265)" }}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 8 }) => (
  <div className="space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "oklch(0.115 0.022 265 / 60%)" }}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32 ml-auto" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const UserSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "oklch(0.115 0.022 265 / 60%)" }}>
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

export default Skeleton;
