import { NextRequest, NextResponse } from "next/server";
import { cmpFetch, cmpFetchAll } from "@/lib/cmp/client";
import { cmpErrorResponse, writeDisabledResponse } from "@/lib/cmp/route-utils";
import type {
  CmpAssetFieldValue,
  CmpEditableField,
  CmpFieldDefinition,
  CmpFieldUpdate,
} from "@/lib/cmp/types";

/**
 * Merges the org's active field definitions with the fields set on the asset.
 * GET /assets/{id}/fields only returns fields that have a value, so the
 * definitions are needed to offer fields that are still empty.
 */
function mergeFields(
  definitions: CmpFieldDefinition[],
  assetFields: CmpAssetFieldValue[]
): CmpEditableField[] {
  const valuesById = new Map(assetFields.map((f) => [f.id, f]));
  const merged: CmpEditableField[] = definitions
    .filter((d) => d.is_active || valuesById.has(d.id))
    .map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      is_multi_select: d.is_multi_select ?? false,
      choices: d.choices ?? valuesById.get(d.id)?.choices ?? [],
      values: valuesById.get(d.id)?.values ?? [],
    }));

  // Fields on the asset that have no definition in the list (shouldn't happen, but don't drop them)
  const known = new Set(merged.map((f) => f.id));
  for (const f of assetFields) {
    if (known.has(f.id)) continue;
    merged.push({
      id: f.id,
      name: f.name,
      type: f.type,
      is_multi_select: f.is_multi_select ?? false,
      choices: f.choices ?? [],
      values: f.values,
    });
  }
  return merged;
}

async function loadFields(id: string) {
  const [definitions, assetFields] = await Promise.all([
    cmpFetchAll<CmpFieldDefinition>("/fields?page_size=100"),
    cmpFetchAll<CmpAssetFieldValue>(`/assets/${id}/fields?page_size=100`, { cache: "no-store" }),
  ]);
  return mergeFields(definitions, assetFields);
}

/** GET /api/cmp/assets/{id}/fields — every editable field with the asset's current values. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    return NextResponse.json(await loadFields(id));
  } catch (error) {
    return cmpErrorResponse(error, "Failed to fetch CMP asset fields");
  }
}

/** PUT /api/cmp/assets/{id}/fields with a `CmpFieldUpdate[]` body; replaces the asset's fields. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = writeDisabledResponse();
  if (disabled) return disabled;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const isValid =
    Array.isArray(body) &&
    body.every(
      (f) => f && typeof f.id === "string" && typeof f.type === "string" && Array.isArray(f.values)
    );
  if (!isValid) {
    return NextResponse.json({ error: "Body must be an array of { id, type, values }" }, { status: 400 });
  }

  const update: CmpFieldUpdate[] = body.map((f: CmpFieldUpdate) => ({
    id: f.id,
    type: f.type,
    values: f.values,
  }));

  try {
    await cmpFetch(`/assets/${id}/fields`, { method: "PUT", body: JSON.stringify(update) });
    // Re-read so the editor shows what CMP actually stored, merged with empty definitions
    return NextResponse.json(await loadFields(id));
  } catch (error) {
    return cmpErrorResponse(error, "Failed to update CMP asset fields");
  }
}
