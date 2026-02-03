import ProductCardSkeleton from "@/components/skeletons/ProductCardSkeleton";

type ProductGridSkeletonProps = {
  count?: number;
  className?: string;
};

export default function ProductGridSkeleton({
  count = 8,
  className = "",
}: ProductGridSkeletonProps) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={`product-grid-skel-${idx}`} />
      ))}
    </div>
  );
}
