import { NextRequest, NextResponse } from "next/server";
import { cmpFetch } from "@/lib/cmp/client";
import type { CmpLineage, CmpPaginatedResponse } from "@/lib/cmp/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await cmpFetch<CmpPaginatedResponse<CmpLineage>>(
      `/asset-lineages?asset_id=${id}`
    );
    return NextResponse.json(data.data);
  } catch (error) {
    console.error("CMP asset lineages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset lineages" },
      { status: 502 }
    );
  }
}
