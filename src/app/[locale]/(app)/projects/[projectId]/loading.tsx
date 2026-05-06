import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="flex gap-4 mb-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}
