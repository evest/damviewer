import { NextRequest, NextResponse } from "next/server";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSET_DETAIL_QUERY } from "@/lib/graphql/queries";
import type { Asset } from "@/lib/types/asset";

interface AssetDetailResponse {
  Asset: {
    items: Asset[];
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await graphqlFetch<AssetDetailResponse>(ASSET_DETAIL_QUERY, {
      where: { Id: { eq: id } },
    });

    if (!data.Asset.items.length) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(data.Asset.items[0]);
  } catch (error) {
    console.error("Asset detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}
