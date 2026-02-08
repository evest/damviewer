import { NextRequest, NextResponse } from "next/server";
import { cmpFetch } from "@/lib/cmp/client";
import type { CmpImageDetail } from "@/lib/cmp/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await cmpFetch<CmpImageDetail>(`/images/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("CMP image detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CMP image detail" },
      { status: 502 }
    );
  }
}
