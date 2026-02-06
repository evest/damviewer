import { NextRequest, NextResponse } from "next/server";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSETS_LIST_QUERY } from "@/lib/graphql/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { buildWhereClause } from "@/lib/graphql/filters";
import type { Asset, AssetListResponse } from "@/lib/types/asset";

interface AssetsQueryResponse {
  Asset: {
    total: number;
    cursor: string;
    items: Asset[];
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 1), 100);
  const cursor = searchParams.get("cursor") ?? undefined;

  const where = buildWhereClause({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    tags: searchParams.get("tags") ?? undefined,
    created: searchParams.get("created") ?? undefined,
  });

  try {
    const data = await graphqlFetch<AssetsQueryResponse>(ASSETS_LIST_QUERY, {
      limit,
      cursor: cursor || undefined,
      where,
      orderBy: { DateCreated: "DESC" },
    });

    const response: AssetListResponse = {
      total: data.Asset.total,
      cursor: data.Asset.cursor,
      items: data.Asset.items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Assets API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
