import { Suspense } from "react";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSETS_LIST_QUERY, ASSETS_FACETS_QUERY } from "@/lib/graphql/queries";
import { AssetGrid } from "@/app/components/assets/AssetGrid";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { PAGE_SIZE } from "@/lib/constants";
import { buildWhereClause } from "@/lib/graphql/filters";
import type { Asset, AssetListResponse, FacetValue } from "@/lib/types/asset";

interface AssetsQueryResponse {
  Asset: {
    total: number;
    cursor: string;
    items: Asset[];
  };
}

interface FacetsQueryResponse {
  Asset: {
    facets: {
      MimeType: FacetValue[];
      Tags: {
        Name: FacetValue[];
      };
    };
    total: number;
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;
  const page = parseInt(typeof params.page === "string" ? params.page : "1", 10);

  const where = buildWhereClause({
    q: typeof params.q === "string" ? params.q : undefined,
    type: typeof params.type === "string" ? params.type : undefined,
    tags: typeof params.tags === "string" ? params.tags : undefined,
    created: typeof params.created === "string" ? params.created : undefined,
  });

  const [assetsData, facetsData] = await Promise.all([
    graphqlFetch<AssetsQueryResponse>(ASSETS_LIST_QUERY, {
      limit: PAGE_SIZE,
      cursor: cursor || undefined,
      where,
      orderBy: { DateCreated: "DESC" },
    }),
    graphqlFetch<FacetsQueryResponse>(ASSETS_FACETS_QUERY),
  ]);

  const data: AssetListResponse = {
    total: assetsData.Asset.total,
    cursor: assetsData.Asset.cursor,
    items: assetsData.Asset.items,
  };

  const tags = facetsData.Asset.facets.Tags.Name;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <Suspense>
        <Sidebar tags={tags} />
      </Suspense>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <AssetGrid data={data} page={page} />
      </main>
    </div>
  );
}
