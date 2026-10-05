export interface CmpImageDetail {
  file_size: number;
  image_resolution: { height: number; width: number };
  is_public: boolean;
  is_archived: boolean;
  attribution_text: string;
  version_number: number;
  focal_point: { x: number; y: number } | null;
  expires_at: string | null;
}

export interface CmpLineage {
  id: string;
  name: string;
  uri: string;
  used_in: string;
  version_id: string;
  rendition_id: string;
  created_at: string;
  links: Record<string, string>;
}

export interface CmpPaginatedResponse<T> {
  data: T[];
  pagination: { next: string | null; previous: string | null };
}

// --- Write-back (tags/expiry via PATCH /{kind}/{id}, custom fields via PUT /assets/{id}/fields) ---

export type CmpAssetKind = "image" | "video" | "raw_file";

/** URL segment of the type-specific asset endpoint for each kind. */
export const CMP_KIND_PATHS: Record<CmpAssetKind, string> = {
  image: "images",
  video: "videos",
  raw_file: "raw-files",
};

export function isCmpAssetKind(value: unknown): value is CmpAssetKind {
  return typeof value === "string" && value in CMP_KIND_PATHS;
}

export interface CmpAssetMetadata {
  tags: string[];
  expires_at: string | null;
}

export interface CmpFieldChoice {
  id: string;
  name: string;
}

/** Org-wide field definition from GET /fields. */
export interface CmpFieldDefinition {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_multi_select?: boolean;
  choices?: CmpFieldChoice[];
}

/** A field as set on an asset, from GET /assets/{id}/fields. */
export interface CmpAssetFieldValue {
  id: string;
  name: string;
  type: string;
  values: unknown[];
  is_multi_select?: boolean;
  choices?: CmpFieldChoice[];
}

/** A field definition merged with the asset's current values, as the editor uses it. */
export interface CmpEditableField {
  id: string;
  name: string;
  type: string;
  is_multi_select: boolean;
  choices: CmpFieldChoice[];
  values: unknown[];
}

/** One item of the PUT /assets/{id}/fields body (a top-level array). */
export interface CmpFieldUpdate {
  id: string;
  type: string;
  values: unknown[];
}
