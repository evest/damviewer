import { NextRequest, NextResponse } from "next/server";
import { graphqlFetch } from "@/lib/graphql/client";
import { ASSETS_LIST_QUERY } from "@/lib/graphql/queries";
import { PAGE_SIZE } from "@/lib/constants";
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

  const q = searchParams.get("q") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const tags = searchParams.get("tags") ?? undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 1), 100);
  const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10), 0);

  const where: Record<string, unknown> = {};

  if (q) {
    where._fulltext = { match: q };
  }

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

  if (tags) {
    const tagNames = tags.split(",").filter(Boolean);
    if (tagNames.length > 0) {
      where.Tags = { Name: { in: tagNames } };
    }
  }

  try {
    const data = await graphqlFetch<AssetsQueryResponse>(ASSETS_LIST_QUERY, {
      limit,
      skip,
      where: Object.keys(where).length > 0 ? where : undefined,
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
