export interface Tag {
  Guid: string;
  Name: string;
}

export interface LabelValue {
  Name: string;
}

export interface LabelGroup {
  Name: string;
}

export interface Label {
  Group: LabelGroup;
  Values: LabelValue[];
}

export interface Rendition {
  Id: string;
  Name: string;
  Width: number;
  Height: number;
  Url: string;
}

export interface FocalPoint {
  X: number;
  Y: number;
}

export interface AssetBase {
  __typename: string;
  Id: string;
  Title: string;
  DateCreated: string;
  DateModified: string;
  MimeType: string;
  LibraryPath: string;
  Tags: Tag[];
  Labels: Label[];
}

export interface ImageAsset extends AssetBase {
  __typename: "PublicImageAsset";
  Url: string;
  Width: number;
  Height: number;
  AltText: string;
  Description: string;
  FocalPoint: FocalPoint | null;
  Renditions: Rendition[];
}

export interface VideoAsset extends AssetBase {
  __typename: "PublicVideoAsset";
  Url: string;
  AltText: string;
  Description: string;
  Renditions: Rendition[];
}

export interface RawFileAsset extends AssetBase {
  __typename: "PublicRawFileAsset";
  Url: string;
  Description: string;
}

export type Asset = ImageAsset | VideoAsset | RawFileAsset | AssetBase;

export interface AssetListResponse {
  total: number;
  cursor: string;
  items: Asset[];
}

export interface FacetValue {
  name: string;
  count: number;
}
