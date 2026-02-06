export const ASSETS_LIST_QUERY = `
  query AssetsList($limit: Int, $skip: Int, $where: AssetWhereInput, $orderBy: AssetOrderByInput) {
    Asset(limit: $limit, skip: $skip, where: $where, orderBy: $orderBy) {
      total
      cursor
      items {
        __typename
        Id
        Title
        DateCreated
        DateModified
        MimeType
        LibraryPath
        Tags {
          Guid
          Name
        }
        Labels {
          Group {
            Name
          }
          Values {
            Name
          }
        }
        ... on PublicImageAsset {
          Url
          Width
          Height
          AltText
          Description
        }
        ... on PublicVideoAsset {
          Url
          AltText
          Description
        }
        ... on PublicRawFileAsset {
          Url
          Description
        }
      }
    }
  }
`;

export const ASSET_DETAIL_QUERY = `
  query AssetDetail($where: AssetWhereInput) {
    Asset(where: $where, limit: 1) {
      items {
        __typename
        Id
        Title
        DateCreated
        DateModified
        MimeType
        LibraryPath
        Tags {
          Guid
          Name
        }
        Labels {
          Group {
            Name
          }
          Values {
            Name
          }
        }
        Fields {
          Id
          Name
          Type
          Values
          _json
        }
        ... on PublicImageAsset {
          Url
          Width
          Height
          AltText
          Description
          FocalPoint {
            X
            Y
          }
          Renditions {
            Id
            Name
            Width
            Height
            Url
          }
        }
        ... on PublicVideoAsset {
          Url
          AltText
          Description
          Renditions {
            Id
            Name
            Width
            Height
            Url
          }
        }
        ... on PublicRawFileAsset {
          Url
          Description
        }
      }
    }
  }
`;

export const ASSETS_FACETS_QUERY = `
  query AssetsFacets {
    Asset(limit: 0) {
      facets {
        MimeType(limit: 20) {
          name
          count
        }
        Tags {
          Name(limit: 50) {
            name
            count
          }
        }
      }
      total
    }
  }
`;
