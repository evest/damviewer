import { NextRequest, NextResponse } from "next/server";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSETS_LIST_QUERY } from "@/lib/graphql/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { buildWhereClause } from "@/lib/graphql/filters";
import type { AssetListResponse } from "@/lib/types/asset";
import type { AssetsQueryResponse } from "@/lib/graphql/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 1), 100);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const where = buildWhereClause({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    tags: searchParams.get("tags") ?? undefined,
    created: searchParams.get("created") ?? undefined,
  });

  try {
    const data = await graphqlFetch<AssetsQueryResponse>(ASSETS_LIST_QUERY, {
      limit,
      skip: (page - 1) * limit,
      where,
      orderBy: { DateCreated: "DESC" },
    });

    const response: AssetListResponse = {
      total: data.Asset.total,
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
