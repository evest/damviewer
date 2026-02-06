"use client";

import { AssetCard } from "./AssetCard";
import { Pagination } from "@/app/components/ui/Pagination";
import type { Asset, AssetListResponse } from "@/lib/types/asset";

interface AssetGridProps {
  data: AssetListResponse;
}

export function AssetGrid({ data }: AssetGridProps) {
  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No assets found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data.items.map((asset: Asset) => (
          <AssetCard key={asset.Id} asset={asset} />
        ))}
      </div>
      <Pagination total={data.total} />
    </div>
  );
}
