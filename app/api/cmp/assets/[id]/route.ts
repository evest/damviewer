import { NextRequest, NextResponse } from "next/server";
import { cmpFetch } from "@/lib/cmp/client";
import { cmpErrorResponse, writeDisabledResponse } from "@/lib/cmp/route-utils";
import { CMP_KIND_PATHS, isCmpAssetKind, type CmpAssetMetadata } from "@/lib/cmp/types";

interface CmpAssetResponse {
  tags: Array<{ name: string }>;
  expires_at: string | null;
}

function toMetadata(asset: CmpAssetResponse): CmpAssetMetadata {
  return { tags: asset.tags.map((t) => t.name), expires_at: asset.expires_at };
}

/** GET /api/cmp/assets/{id}?kind=image|video|raw_file — fresh tags and expiry. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const kind = request.nextUrl.searchParams.get("kind");
  if (!isCmpAssetKind(kind)) {
    return NextResponse.json({ error: "Invalid or missing kind" }, { status: 400 });
  }

  try {
    const asset = await cmpFetch<CmpAssetResponse>(`/${CMP_KIND_PATHS[kind]}/${id}`, {
      cache: "no-store",
    });
    return NextResponse.json(toMetadata(asset));
  } catch (error) {
    return cmpErrorResponse(error, "Failed to fetch CMP asset");
  }
}

/** PATCH /api/cmp/assets/{id} with `{ kind, tags?, expires_at? }`. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = writeDisabledResponse();
  if (disabled) return disabled;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const kind: unknown = body?.kind;
  if (!isCmpAssetKind(kind)) {
    return NextResponse.json({ error: "Invalid or missing kind" }, { status: 400 });
  }

  // Only forward the fields this editor manages
  const update: Partial<CmpAssetMetadata> = {};
  if (Array.isArray(body.tags)) update.tags = body.tags;
  if (body.expires_at === null || typeof body.expires_at === "string") {
    update.expires_at = body.expires_at;
  }

  try {
    const asset = await cmpFetch<CmpAssetResponse>(`/${CMP_KIND_PATHS[kind]}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    return NextResponse.json(toMetadata(asset));
  } catch (error) {
    return cmpErrorResponse(error, "Failed to update CMP asset");
  }
}
