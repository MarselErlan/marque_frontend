/**
 * Product Card Skeleton
 * Loading skeleton for product cards - better UX than spinners
 */

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-3 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
      
      {/* Brand skeleton */}
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
      
      {/* Title skeleton (2 lines) */}
      <div className="space-y-2 mb-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      
      {/* Price skeleton */}
      <div className="h-5 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

export const ProductCardSkeletonGrid = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

