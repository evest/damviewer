import { Suspense } from "react";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSETS_LIST_QUERY, ASSETS_FACETS_QUERY } from "@/lib/graphql/queries";
import { AssetGrid } from "@/app/components/assets/AssetGrid";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { PAGE_SIZE } from "@/lib/constants";
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

function buildWhere(searchParams: Record<string, string | string[] | undefined>) {
  const where: Record<string, unknown> = {};

  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  if (q) {
    where._fulltext = { match: q };
  }

  const type = typeof searchParams.type === "string" ? searchParams.type : undefined;
  if (type) {
    const types = type.split(",").filter(Boolean);
    const prefixes: string[] = [];
    for (const t of types) {
      if (t === "image") prefixes.push("image/");
      else if (t === "video") prefixes.push("video/");
      else if (t === "raw") prefixes.push("application/", "text/");
    }
    if (prefixes.length > 0) {
      where.MimeType = { in: prefixes };
    }
  }

  const tags = typeof searchParams.tags === "string" ? searchParams.tags : undefined;
  if (tags) {
    const tagNames = tags.split(",").filter(Boolean);
    if (tagNames.length > 0) {
      where.Tags = { Name: { in: tagNames } };
    }
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const skip = parseInt(
    typeof params.skip === "string" ? params.skip : "0",
    10
  );

  const where = buildWhere(params);

  const [assetsData, facetsData] = await Promise.all([
    graphqlFetch<AssetsQueryResponse>(ASSETS_LIST_QUERY, {
      limit: PAGE_SIZE,
      skip,
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
        <AssetGrid data={data} />
      </main>
    </div>
  );
}
