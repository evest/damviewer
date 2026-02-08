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
