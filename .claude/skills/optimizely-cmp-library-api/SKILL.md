---
name: optimizely-cmp-library-api
description: "Build TypeScript/Node.js applications that interact with the Optimizely Content Marketing Platform (CMP) Library (DAM) REST API. Use when the user requests: (1) Listing, searching, or filtering assets in the CMP Library, (2) Uploading images, videos, or files to the DAM, (3) Managing folders and folder permissions, (4) Updating asset metadata, labels, or fields, (5) Managing asset versions or renditions, (6) Downloading assets via file URLs, (7) Working with structured content in the library, (8) Authenticating with the CMP API using OAuth client credentials. Covers authentication, asset CRUD, folder management, upload workflows, labels, fields, permissions, and pagination."
---

# Optimizely CMP Library (DAM) API

Build server-side TypeScript/Node.js applications that interact with the Optimizely Content Marketing Platform Library using the REST API.

## Overview

The Optimizely CMP Library API (also called the DAM API) provides endpoints for managing digital assets — images, videos, raw files, articles, and structured content — within the Optimizely CMP platform.

**Key capabilities:**
- **Assets**: List, search, filter, create, update, and delete assets (images, videos, raw files, articles, structured content)
- **Folders**: Create, list, update, delete folders and manage folder permissions
- **Upload**: Upload files via pre-signed URLs (standard and multipart for large files)
- **Labels**: Read label groups for categorizing assets
- **Fields**: Read and update custom metadata fields on assets (includes available choices for dropdown/checkbox fields)
- **Versions**: Add new versions to existing library assets
- **Renditions**: Retrieve asset renditions with download URLs
- **Permissions**: Manage access control on assets and folders
- **Download**: Generate download URLs for assets

## Important: Verified API Behavior

The response shapes and endpoint behavior documented below have been **verified against the live API**. Key things to know:

- **There is no `GET /assets/{id}` endpoint.** You must use type-specific endpoints: `/images/{id}`, `/videos/{id}`, `/raw-files/{id}`, `/articles/{id}`, `/structured-contents/{id}`.
- **List endpoint (`GET /assets`) returns a summary.** Type-specific endpoints return the full detail with additional fields like `file_size`, `image_resolution`, `focal_point`, `tags`, `version_number`, etc.
- **Pagination uses `next`/`previous` URLs**, not offset/page_size in the response pagination object.

## Configuration

### Environment Variables

Store credentials in a `.env` file. **Never commit secrets to source control.**

```env
# .env
CMP_CLIENT_ID=your-client-id-here
CMP_CLIENT_SECRET=your-client-secret-here
CMP_API_BASE_URL=https://api.cmp.optimizely.com/v3
CMP_AUTH_TOKEN_URL=https://accounts.cmp.optimizely.com/o/oauth2/v1/token
```

### Required Dependencies

```json
{
  "dependencies": {
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0"
  }
}
```

## Authentication

Use the **Client Credentials Flow** for machine-to-machine authentication. This flow obtains an `access_token` using the `client_id` and `client_secret` without user interaction.

### How It Works

1. POST to the token endpoint with `client_id`, `client_secret`, and `grant_type=client_credentials`
2. Receive an `access_token` (valid for ~1 hour in production, ~30 days in development)
3. Include the token in the `Authorization: Bearer <token>` header on all API requests
4. Cache the token and refresh it before expiry or when you get a `401` response

### Token Request

```
POST https://accounts.cmp.optimizely.com/o/oauth2/v1/token
Content-Type: application/json

{
  "client_id": "<your-client-id>",
  "client_secret": "<your-client-secret>",
  "grant_type": "client_credentials"
}
```

**Response:**
```json
{
  "access_token": "b3717c0a-6857-4858-8274-9fe7b51180c9",
  "expires_in": 3599,
  "token_type": "Bearer"
}
```

### Important Token Notes

- **Rate limit**: Avoid requesting tokens too frequently. Cache and reuse tokens until they are close to expiring.
- **Production mode**: Access tokens expire after 1 hour.
- **Development mode**: Access tokens expire after 30 days.
- Request a new token shortly before the current one expires or when you receive a `401` error.

### Enabling Client Credentials Flow

In the CMP admin UI: **Admin** > **Apps and Webhooks** > click your app > **Authorization Permissions** > toggle **Allow Client Credentials**.

## Authentication Helper

Use this pattern for all API interactions:

```typescript
import 'dotenv/config';

const CMP_API_BASE = process.env.CMP_API_BASE_URL || 'https://api.cmp.optimizely.com/v3';
const CMP_TOKEN_URL = process.env.CMP_AUTH_TOKEN_URL || 'https://accounts.cmp.optimizely.com/o/oauth2/v1/token';
const CMP_CLIENT_ID = process.env.CMP_CLIENT_ID!;
const CMP_CLIENT_SECRET = process.env.CMP_CLIENT_SECRET!;

let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  const response = await fetch(CMP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CMP_CLIENT_ID,
      client_secret: CMP_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

async function cmpFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${CMP_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Retry once on 401 (token expired)
  if (response.status === 401) {
    cachedToken = null;
    const newToken = await getAccessToken();
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  return response;
}
```

## Pagination

All list endpoints use offset-based pagination with these query parameters:

| Parameter   | Type   | Default | Description                  |
|-------------|--------|---------|------------------------------|
| `offset`    | number | 0       | Number of items to skip      |
| `page_size` | number | 10      | Number of items per page (max varies) |

**Response pagination object:**
```json
{
  "data": [...],
  "pagination": {
    "next": "https://api.cmp.optimizely.com/v3/assets?offset=10&page_size=10",
    "previous": null
  },
  "total_count": 164
}
```

Note: The pagination object contains `next` and `previous` URLs (or `null`). Use `next` to determine if there are more pages.

### Pagination Helper

```typescript
async function fetchAllPages<T>(path: string, pageSize = 50): Promise<T[]> {
  const allItems: T[] = [];
  let currentUrl: string | null = path.includes('?')
    ? `${path}&page_size=${pageSize}`
    : `${path}?page_size=${pageSize}`;

  while (currentUrl) {
    const response = await cmpFetch(currentUrl);
    const data = await response.json();

    allItems.push(...data.data);
    currentUrl = data.pagination.next;
  }

  return allItems;
}
```

## API Reference — Library Endpoints

### Assets

#### List Assets — `GET /assets`

Returns assets sorted by `modified_at` descending. This returns a **summary view** of assets — use type-specific endpoints for full details.

**Query parameters:**

| Parameter                  | Type     | Description                                           |
|----------------------------|----------|-------------------------------------------------------|
| `type`                     | string[] | Filter by type: `image`, `video`, `raw_file`, `article`, `structured_content` |
| `folder_id`                | string   | Filter by folder ID                                   |
| `include_subfolder_assets` | boolean  | Include assets from subfolders (default: true)        |
| `search_text`              | string   | Search by title or content description                |
| `campaign_id`              | string   | Filter by campaign ID                                 |
| `label`                    | object[] | Filter by labels (URL-encoded JSON)                   |
| `fields`                   | object[] | Filter by fields (base64 encoded JSON)                |
| `created_at__from`         | string   | ISO 8601 date lower bound for creation date           |
| `created_at__to`           | string   | ISO 8601 date upper bound for creation date           |
| `modified_at__from`        | string   | ISO 8601 date lower bound for modification date       |
| `modified_at__to`          | string   | ISO 8601 date upper bound for modification date       |
| `offset`                   | number   | Pagination offset                                     |
| `page_size`                | number   | Items per page                                        |

```typescript
// List all images
const response = await cmpFetch('/assets?type=image&page_size=20');
const { data: assets, pagination, total_count } = await response.json();

// Search assets
const searchResponse = await cmpFetch('/assets?search_text=logo&type=image');

// Filter by folder (without subfolder assets)
const folderResponse = await cmpFetch(
  '/assets?folder_id=6bb8db20a5b611ebae319b7c541b1a7f&include_subfolder_assets=false'
);

// Filter by date range
const dateResponse = await cmpFetch(
  '/assets?created_at__from=2024-01-01T00:00:00Z&created_at__to=2024-12-31T23:59:59Z'
);
```

**Asset list item response shape (verified):**
```typescript
interface AssetListItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'raw_file' | 'article' | 'structured_content';
  mime_type: string;                    // e.g. "image/jpeg", "application/x-structured-content"
  created_at: string;                   // ISO 8601
  modified_at: string;                  // ISO 8601
  labels: AssetLabel[];                 // always present (empty array if none)
  folder_id: string | null;
  file_location: string;               // e.g. "/" for root
  is_archived: boolean;
  owner_organization_id: string;
  thumbnail_url: string;                // CDN URL for thumbnail
  file_extension: string | null;        // e.g. "jpg", null for structured content
  content?: {                           // present for structured content
    type: string;                       // e.g. "api_url"
    value: string;                      // URL to fetch full content
  };
  links: {
    self: string;                       // type-specific URL (e.g. /images/{id}, /structured-contents/{id})
  };
}
```

#### Get Asset by Type — `GET /images/{id}`, `GET /videos/{id}`, `GET /raw-files/{id}`

**IMPORTANT: There is no generic `GET /assets/{id}` endpoint.** You must know the asset type and use the corresponding type-specific endpoint. If you only have an ID, first find the asset via `GET /assets` to determine its type, then fetch via the type-specific endpoint.

```typescript
// Get an image — returns full image details
const image = await cmpFetch('/images/4c81d34cf58b11ee80807e3afe24df5e');

// Get a video
const video = await cmpFetch('/videos/5d7f910551b00a722e0418830cee6633');

// Get a raw file
const rawFile = await cmpFetch('/raw-files/5d7f910551b00a722e0418830cee6634');

// Get an article
const article = await cmpFetch('/articles/5d7f910551b00a722e0418830cee6631');

// Get structured content
const sc = await cmpFetch('/structured-contents/a24b834427a043ab8caed1ded4606f7d');
```

**Image response shape (verified):**
```typescript
interface ImageDetailResponse {
  id: string;
  title: string;
  mime_type: string;                    // "image/jpeg", "image/png", etc.
  created_at: string;                   // ISO 8601
  modified_at: string;                  // ISO 8601
  file_size: number;                    // bytes
  image_resolution: {
    height: number;
    width: number;
  };
  url: string;                          // full CDN URL for the image
  thumbnail_url: string;                // CDN URL for thumbnail
  focal_point: {                        // may have null x/y if not set
    x: number | null;
    y: number | null;
  };
  description: string;                  // empty string if not set
  alt_text: string;                     // empty string if not set
  attribution_text: string;             // empty string if not set
  tags: Array<{
    guid: string;
    name: string;
  }>;
  labels: AssetLabel[];
  folder_id: string | null;
  file_location: string;
  file_extension: string;               // e.g. "jpg"
  is_archived: boolean;
  is_public: boolean;
  owner_organization_id: string;
  owner_id: string;                     // user ID of asset owner
  expires_at: string | null;            // ISO 8601 or null
  version_number: number;
  version_id: string;
}
```

Note: Video and raw file responses follow a similar shape but with type-specific fields (e.g. videos may include duration).

#### Update Assets — `PATCH /images/{id}`, `PATCH /videos/{id}`, `PATCH /raw-files/{id}`

```typescript
// Update an image title and description
const updateResponse = await cmpFetch('/images/5d7f910551b00a722e0418830cee6632', {
  method: 'PATCH',
  body: JSON.stringify({
    title: 'Updated Image Title',
    description: 'New description for this image',
    folder_id: 'target-folder-id', // optionally move to a different folder
  }),
});
```

#### Delete Assets

```typescript
// Delete an image
await cmpFetch('/images/5d7f910551b00a722e0418830cee6632', { method: 'DELETE' });

// Delete a video
await cmpFetch('/videos/5d7f910551b00a722e0418830cee6633', { method: 'DELETE' });

// Delete a raw file
await cmpFetch('/raw-files/5d7f910551b00a722e0418830cee6634', { method: 'DELETE' });
```

### Upload Assets

Uploading is a multi-step process:

1. **Get a pre-signed upload URL** — `GET /upload-url`
2. **Upload the file** to the pre-signed URL as `multipart/form-data`
3. **Create the asset** in the library — `POST /assets`

```typescript
import { createReadStream } from 'fs';
import { basename } from 'path';

async function uploadAssetToLibrary(filePath: string, title: string, folderId?: string) {
  // Step 1: Get pre-signed upload URL
  const uploadUrlResponse = await cmpFetch('/upload-url');
  const { url: presignedUrl, upload_meta_fields } = await uploadUrlResponse.json();

  // Step 2: Upload file to pre-signed URL
  const formData = new FormData();

  // IMPORTANT: Meta fields must be added in the same order as received
  formData.append('key', upload_meta_fields.key);
  formData.append('policy', upload_meta_fields.policy);
  formData.append('x-amz-algorithm', upload_meta_fields['x-amz-algorithm']);
  formData.append('x-amz-credential', upload_meta_fields['x-amz-credential']);
  formData.append('x-amz-date', upload_meta_fields['x-amz-date']);
  formData.append('x-amz-security-token', upload_meta_fields['x-amz-security-token']);
  formData.append('x-amz-signature', upload_meta_fields['x-amz-signature']);

  // IMPORTANT: The file field MUST be appended last
  const fileBuffer = await import('fs').then(fs => fs.promises.readFile(filePath));
  const blob = new Blob([fileBuffer]);
  formData.append('file', blob, basename(filePath));

  const uploadResponse = await fetch(presignedUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok && uploadResponse.status !== 204) {
    throw new Error(`Upload failed: ${uploadResponse.status}`);
  }

  // Step 3: Create asset in library
  const assetPayload: Record<string, unknown> = {
    key: upload_meta_fields.key,
    title: title,
  };
  if (folderId) {
    assetPayload.folder_id = folderId;
  }

  const assetResponse = await cmpFetch('/assets', {
    method: 'POST',
    body: JSON.stringify(assetPayload),
  });

  return assetResponse.json();
}
```

#### Multipart Upload (Large Files)

For large files, use the multipart upload API to split the file into parts:

```typescript
async function multipartUpload(filePath: string, title: string) {
  const fs = await import('fs/promises');
  const fileBuffer = await fs.readFile(filePath);
  const fileSize = fileBuffer.byteLength;
  const partSize = 10 * 1024 * 1024; // 10MB parts

  // Step 1: Create multipart upload
  const createResponse = await cmpFetch('/multipart-uploads', {
    method: 'POST',
    body: JSON.stringify({ file_size: fileSize, part_size: partSize }),
  });
  const { id, upload_part_urls, links } = await createResponse.json();

  // Step 2: Upload each part using PUT
  for (let i = 0; i < upload_part_urls.length; i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, fileSize);
    const partBuffer = fileBuffer.subarray(start, end);

    await fetch(upload_part_urls[i], {
      method: 'PUT',
      body: partBuffer,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }

  // Step 3: Complete the upload
  const completeResponse = await cmpFetch(links.complete, { method: 'POST' });
  const { key } = await completeResponse.json();

  // Step 4: Poll for completion
  let status = 'UPLOAD_COMPLETION_IN_PROGRESS';
  while (status === 'UPLOAD_COMPLETION_IN_PROGRESS' || status === 'UPLOAD_COMPLETION_NOT_STARTED') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const statusResponse = await cmpFetch(links.status);
    const statusData = await statusResponse.json();
    status = statusData.status;
    if (status === 'UPLOAD_COMPLETION_FAILED') {
      throw new Error(`Multipart upload failed: ${statusData.status_message}`);
    }
  }

  // Step 5: Create asset in library
  const assetResponse = await cmpFetch('/assets', {
    method: 'POST',
    body: JSON.stringify({ key, title }),
  });

  return assetResponse.json();
}
```

### Asset Versions

Add a new version to an existing library asset:

```typescript
// After uploading a file and getting the key
const versionResponse = await cmpFetch('/assets/ASSET_ID/versions', {
  method: 'POST',
  body: JSON.stringify({ key: upload_meta_fields.key, title: 'v2 of the asset' }),
});
```

### Asset Renditions — `GET /assets/{id}/renditions`

Renditions are pre-generated variants of an asset (e.g. different crops, sizes, formats for social media).

```typescript
// Get renditions for an asset
const renditionsResponse = await cmpFetch('/assets/ASSET_ID/renditions');
const { data: renditions } = await renditionsResponse.json();

// Get a specific rendition
const rendition = await cmpFetch('/renditions/RENDITION_ID');

// Get rendition configuration
const config = await cmpFetch('/rendition-configs/CONFIG_ID');
```

**Rendition response shape (verified):**
```typescript
interface RenditionResponse {
  id: string;
  name: string;                         // e.g. "LinkedIn", "Wide (16:9)", "E-mail (600x___)"
  created_at: string;                   // ISO 8601
  mime_type: string;                    // e.g. "image/jpeg"
  url: string;                          // direct CDN URL to download the rendition
}
```

### Download URLs — `POST /file-urls`

Generate download URLs for files by their GUID:

```typescript
const downloadUrlResponse = await cmpFetch('/file-urls', {
  method: 'POST',
  body: JSON.stringify({
    file_guids: ['file-guid-1', 'file-guid-2'],
  }),
});
const { data: fileUrls } = await downloadUrlResponse.json();
```

### Folders

#### List Folders — `GET /folders`

```typescript
// List all root-level folders
const foldersResponse = await cmpFetch('/folders');
const { data: folders } = await foldersResponse.json();

// List child folders of a parent
const childFolders = await cmpFetch('/folders?parent_folder_id=PARENT_ID');
```

**Folder response shape:**
```typescript
interface FolderResponse {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  modified_at: string;
  links: {
    self: string;
    [key: string]: string;
  };
}
```

#### Create Folder — `POST /folders`

```typescript
const newFolder = await cmpFetch('/folders', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Campaign Assets Q1',
    parent_folder_id: 'optional-parent-id', // omit for root-level
  }),
});
```

#### Update Folder — `PATCH /folders/{id}`

```typescript
// Rename a folder or move it under a different parent
await cmpFetch('/folders/FOLDER_ID', {
  method: 'PATCH',
  body: JSON.stringify({
    name: 'Renamed Folder',
    parent_folder_id: 'new-parent-id',
  }),
});
```

#### Delete Folder — `DELETE /folders/{id}`

```typescript
await cmpFetch('/folders/FOLDER_ID', { method: 'DELETE' });
```

#### Folder Permissions

```typescript
// List permissions on a folder
const perms = await cmpFetch('/folders/FOLDER_ID/permissions');

// Grant access to users/teams
await cmpFetch('/folders/FOLDER_ID/permissions', {
  method: 'POST',
  body: JSON.stringify({
    accessors: [
      { id: 'user-or-team-id', type: 'user', access: 'edit' }
    ],
  }),
});

// Update permission level
await cmpFetch('/folders/FOLDER_ID/permissions/ACCESSOR_ID', {
  method: 'PATCH',
  body: JSON.stringify({ access: 'view' }),
});

// Remove access
await cmpFetch('/folders/FOLDER_ID/permissions/ACCESSOR_ID', { method: 'DELETE' });
```

### Asset Permissions — `GET /assets/{id}/permissions`

```typescript
// List permissions on an asset
const assetPerms = await cmpFetch('/assets/ASSET_ID/permissions');

// Grant access
await cmpFetch('/assets/ASSET_ID/permissions', {
  method: 'POST',
  body: JSON.stringify({
    accessors: [
      { id: 'user-or-team-id', type: 'user', access: 'view' }
    ],
  }),
});

// Update access level
await cmpFetch('/assets/ASSET_ID/permissions/ACCESSOR_ID', {
  method: 'PATCH',
  body: JSON.stringify({ access: 'edit' }),
});

// Remove access
await cmpFetch('/assets/ASSET_ID/permissions/ACCESSOR_ID', { method: 'DELETE' });
```

**Permission response shape (verified):**
```typescript
interface PermissionEntry {
  id: string;
  name: string;                         // display name of user, team, or organization
  type: 'organization' | 'user' | 'team';
  access_type: 'view' | 'edit' | 'comment' | 'delete';  // note: "access_type" not "access"
  is_owner: boolean;
  links: {
    accessor: string | null;            // URL to user/team endpoint, null for organizations
  };
}
```

### Labels — `GET /label-groups`

Label groups are used for categorizing assets.

```typescript
// List all label groups
const labelGroupsResponse = await cmpFetch('/label-groups');
const { data: labelGroups } = await labelGroupsResponse.json();
```

**Label group response shape:**
```typescript
interface LabelGroup {
  id: string;
  name: string;
  values: Array<{
    id: string;
    name: string;
  }>;
}
```

### Asset Fields — `GET /assets/{id}/fields`

Read and update custom metadata fields on assets. The GET response includes the full field definition with available choices for dropdown/checkbox fields.

```typescript
// Get fields for an asset
const fieldsResponse = await cmpFetch('/assets/ASSET_ID/fields');
const { data: fields } = await fieldsResponse.json();

// Replace all fields on an asset
await cmpFetch('/assets/ASSET_ID/fields', {
  method: 'PUT',
  body: JSON.stringify({
    data: [
      { id: 'field-id-1', value: 'New text value' },
      { id: 'field-id-2', value: ['option-id-1', 'option-id-2'] },
    ],
  }),
});

// Update a single field
await cmpFetch('/assets/ASSET_ID/fields/FIELD_ID', {
  method: 'PUT',
  body: JSON.stringify({ value: 'Updated value' }),
});
```

**Field response shape (verified):**
```typescript
interface AssetFieldResponse {
  id: string;
  name: string;                         // display name, e.g. "Tour Destination"
  type: string;                         // e.g. "dropdown", "text", "checkbox", etc.
  values: string[];                     // selected value IDs (for choice fields) or text values
  is_multi_select: boolean;             // whether multiple values can be selected
  choices?: Array<{                     // available options (present for dropdown/checkbox/radio fields)
    id: string;
    name: string;                       // human-readable choice name
  }>;
}
```

To resolve a field's selected values to display names, map `values` IDs against the `choices` array:

```typescript
function resolveFieldValues(field: AssetFieldResponse): string[] {
  if (!field.values || field.values.length === 0) return [];
  if (!field.choices) return field.values; // text fields — values are already strings

  const choiceMap = new Map(field.choices.map(c => [c.id, c.name]));
  return field.values.map(id => choiceMap.get(id) ?? id);
}
```

**Field types:**
- `text`, `text_area`, `rich_text` — string value
- `date` — ISO 8601 string
- `dropdown`, `radio_button` — single option ID (choices provided in response)
- `checkbox` — array of option IDs (choices provided in response)
- `label` — label value IDs
- `simple_number`, `percentage_number`, `currency_number` — numeric value
- `image`, `video` — file reference

### Asset Lineages

Track where assets are used externally:

```typescript
// Add an external lineage
const lineage = await cmpFetch('/assets/ASSET_ID/lineages', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://www.example.com/page-using-asset',
    name: 'Company Website - Hero Banner',
  }),
});

// List lineages
const lineages = await cmpFetch('/asset-lineages?asset_id=ASSET_ID');

// Delete a lineage
await cmpFetch('/assets/ASSET_ID/lineages/LINEAGE_ID', { method: 'DELETE' });
```

### Structured Content

```typescript
// Create structured content
const sc = await cmpFetch('/structured-contents', {
  method: 'POST',
  body: JSON.stringify({
    content_type_id: 'content-type-id',
    title: 'My Structured Content',
    // additional fields based on content type definition
  }),
});

// Get structured content
const scData = await cmpFetch('/structured-contents/SC_ID');

// Update structured content
await cmpFetch('/structured-contents/SC_ID', {
  method: 'PATCH',
  body: JSON.stringify({
    title: 'Updated Title',
  }),
});
```

## Error Handling

The API returns standard HTTP status codes:

| Code | Meaning                                                    |
|------|------------------------------------------------------------|
| 200  | Success                                                    |
| 201  | Created                                                    |
| 204  | No content (successful delete or permission grant)         |
| 400  | Bad request (invalid parameters)                           |
| 401  | Unauthorized (invalid or expired token)                    |
| 403  | Forbidden (insufficient permissions)                       |
| 404  | Not found                                                  |
| 422  | Unprocessable entity (validation error)                    |

**Error response shape:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descriptive error message"
  }
}
```

### Error Handling Pattern

```typescript
async function safeApiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await cmpFetch(path, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`CMP API Error ${response.status}: ${errorBody}`);
  }

  // 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
```

## Rate Limits

The CMP API applies rate limits. If you hit a rate limit, the API returns an HTTP 429 response. Best practices:

- Cache tokens — don't request a new token for every API call
- Use pagination with reasonable page sizes (10–50)
- Add retry logic with exponential backoff for 429 responses
- Batch operations where possible

## Complete TypeScript Types

```typescript
// Core types for the CMP Library API
// Types marked "verified" have been confirmed against the live API

// --- Pagination ---

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    next: string | null;                // URL for next page, null if last page
    previous: string | null;            // URL for previous page, null if first page
  };
}

interface AssetListResponse extends PaginatedResponse<AssetListItem> {
  total_count: number;
}

// --- Asset List (GET /assets) — verified ---

interface AssetListItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'raw_file' | 'article' | 'structured_content';
  mime_type: string;
  created_at: string;
  modified_at: string;
  labels: AssetLabel[];
  folder_id: string | null;
  file_location: string;
  is_archived: boolean;
  owner_organization_id: string;
  thumbnail_url: string;
  file_extension: string | null;
  content?: { type: string; value: string };  // structured content only
  links: { self: string };
}

// --- Asset Labels — verified ---

interface AssetLabel {
  group: { id: string; name: string };
  values: Array<{ id: string; name: string }>;
}

// --- Image Detail (GET /images/{id}) — verified ---

interface ImageDetailResponse {
  id: string;
  title: string;
  mime_type: string;
  created_at: string;
  modified_at: string;
  file_size: number;
  image_resolution: { height: number; width: number };
  url: string;
  thumbnail_url: string;
  focal_point: { x: number | null; y: number | null };
  description: string;
  alt_text: string;
  attribution_text: string;
  tags: Array<{ guid: string; name: string }>;
  labels: AssetLabel[];
  folder_id: string | null;
  file_location: string;
  file_extension: string;
  is_archived: boolean;
  is_public: boolean;
  owner_organization_id: string;
  owner_id: string;
  expires_at: string | null;
  version_number: number;
  version_id: string;
}

// --- Asset Fields (GET /assets/{id}/fields) — verified ---

interface AssetFieldResponse {
  id: string;
  name: string;
  type: string;
  values: string[];
  is_multi_select: boolean;
  choices?: Array<{ id: string; name: string }>;
}

// --- Renditions (GET /assets/{id}/renditions) — verified ---

interface RenditionResponse {
  id: string;
  name: string;
  created_at: string;
  mime_type: string;
  url: string;
}

// --- Permissions (GET /assets/{id}/permissions) — verified ---

interface PermissionEntry {
  id: string;
  name: string;
  type: 'organization' | 'user' | 'team';
  access_type: 'view' | 'edit' | 'comment' | 'delete';
  is_owner: boolean;
  links: { accessor: string | null };
}

// --- Folders ---

interface FolderResponse {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  modified_at: string;
  links: Record<string, string>;
}

interface FolderCreateRequest {
  name: string;
  parent_folder_id?: string;
}

interface FolderUpdateRequest {
  name?: string;
  parent_folder_id?: string;
}

// --- Upload ---

interface AssetCreateRequest {
  key: string;
  title: string;
  folder_id?: string;
}

interface AssetUpdateRequest {
  title?: string;
  description?: string;
  folder_id?: string;
}

interface UploadUrlResponse {
  url: string;
  upload_meta_fields: {
    key: string;
    policy: string;
    'x-amz-algorithm': string;
    'x-amz-credential': string;
    'x-amz-date': string;
    'x-amz-security-token': string;
    'x-amz-signature': string;
  };
}

interface MultipartUploadCreateRequest {
  file_size: number;
  part_size?: number; // default 5MB, min 5MB, max 5GB
}

interface MultipartUploadResponse {
  id: string;
  expires_at: string;
  upload_part_count: number;
  upload_part_urls: string[];
  links: {
    complete: string;
    status: string;
  };
}

interface MultipartUploadStatus {
  id: string;
  key: string;
  status: 'UPLOAD_COMPLETION_NOT_STARTED' | 'UPLOAD_COMPLETION_IN_PROGRESS' | 'UPLOAD_COMPLETION_SUCCEEDED' | 'UPLOAD_COMPLETION_FAILED';
  status_message: string | null;
  expires_at: string;
}

// --- Labels ---

interface LabelGroup {
  id: string;
  name: string;
  source_org_type?: string;
  values: Array<{ id: string; name: string }>;
  links: Record<string, string>;
}

// --- File URLs ---

interface FileUrlRequest {
  file_guids: string[];
}

interface FileUrlResponse {
  data: Array<{
    file_guid: string;
    url: string;
  }>;
}

// --- Lineages ---

interface AssetLineageRequest {
  url: string;
  name: string;
}

interface AssetLineageResponse {
  id: string;
  asset_id: string;
  url: string;
  name: string;
  created_at: string;
  links: Record<string, string>;
}
```

## List vs Detail: What Each Endpoint Returns

| Field                 | `GET /assets` (list) | `GET /images/{id}` (detail) |
|-----------------------|:--------------------:|:---------------------------:|
| id, title, mime_type  | Yes                  | Yes                         |
| created_at, modified_at | Yes                | Yes                         |
| labels                | Yes                  | Yes                         |
| folder_id, file_location | Yes              | Yes                         |
| is_archived           | Yes                  | Yes                         |
| thumbnail_url         | Yes                  | Yes                         |
| file_extension        | Yes                  | Yes                         |
| links.self            | Yes                  | No                          |
| type                  | Yes                  | No (implicit from endpoint) |
| **file_size**         | No                   | Yes                         |
| **image_resolution**  | No                   | Yes                         |
| **url** (full CDN)    | No                   | Yes                         |
| **focal_point**       | No                   | Yes                         |
| **description**       | No                   | Yes                         |
| **alt_text**          | No                   | Yes                         |
| **attribution_text**  | No                   | Yes                         |
| **tags**              | No                   | Yes                         |
| **is_public**         | No                   | Yes                         |
| **owner_id**          | No                   | Yes                         |
| **expires_at**        | No                   | Yes                         |
| **version_number/id** | No                   | Yes                         |

## Documentation Links

- **API Overview**: https://docs.developers.optimizely.com/content-marketing-platform/docs/open-api-introduction
- **Authentication**: https://docs.developers.optimizely.com/content-marketing-platform/docs/authentication-1
- **API Reference**: https://docs.developers.optimizely.com/content-marketing-platform/reference/api-reference
- **OpenAPI Spec**: https://docs.developers.optimizely.com/content-marketing-platform/openapi/optimizely-cmp-open-api-documentation.json
- **Upload Assets**: https://docs.developers.optimizely.com/content-marketing-platform/docs/upload-assets
- **Multipart Upload**: https://docs.developers.optimizely.com/content-marketing-platform/docs/multipart-upload
- **Rate Limits**: https://docs.developers.optimizely.com/content-marketing-platform/docs/rate-limits-1
