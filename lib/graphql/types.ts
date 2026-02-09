import type { Asset, FacetValue } from "@/lib/types/asset";

export interface AssetsQueryResponse {
  Asset: {
    total: number;
    items: Asset[];
  };
}

export interface FacetsQueryResponse {
  Asset: {
    facets: {
      MimeType: FacetValue[];
      Tags: {
        Name: FacetValue[];
      };
    };
    total: number;
  };
}

export interface AssetDetailResponse {
  Asset: {
    items: Asset[];
  };
}
