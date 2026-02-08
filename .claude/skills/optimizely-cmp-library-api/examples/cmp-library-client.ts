/**
 * Optimizely CMP Library API Client
 *
 * A reusable client for interacting with the Optimizely CMP Library (DAM) REST API.
 * Uses the Client Credentials OAuth flow for machine-to-machine authentication.
 *
 * Usage:
 *   1. Copy this file and the .env.example into your project
 *   2. Rename .env.example to .env and fill in your credentials
 *   3. Install dependencies: npm install dotenv
 *   4. Import and use: import { CmpLibraryClient } from './cmp-library-client';
 */

import 'dotenv/config';

// ─── Configuration ──────────────────────────────────────────────────────────

const CMP_API_BASE = process.env.CMP_API_BASE_URL || 'https://api.cmp.optimizely.com/v3';
const CMP_TOKEN_URL = process.env.CMP_AUTH_TOKEN_URL || 'https://accounts.cmp.optimizely.com/o/oauth2/v1/token';
const CMP_CLIENT_ID = process.env.CMP_CLIENT_ID!;
const CMP_CLIENT_SECRET = process.env.CMP_CLIENT_SECRET!;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    offset: number;
    page_size: number;
    next: string | null;
  };
}

export interface AssetListResponse extends PaginatedResponse<Asset> {
  total_count: number;
}

export type AssetType = 'image' | 'video' | 'raw_file' | 'article' | 'structured_content';

export interface Asset {
  id: string;
  title: string;
  type: AssetType;
  created_at: string;
  modified_at: string;
  description?: string;
  labels?: Array<{
    id: string;
    group: { id: string; name: string };
    values: Array<{ id: string; name: string }>;
  }>;
  links: Record<string, string>;
}

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  modified_at: string;
  links: Record<string, string>;
}

export interface UploadUrlResponse {
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

export interface MultipartUploadResponse {
  id: string;
  expires_at: string;
  upload_part_count: number;
  upload_part_urls: string[];
  links: { complete: string; status: string };
}

export interface MultipartUploadStatus {
  id: string;
  key: string;
  status: 'UPLOAD_COMPLETION_NOT_STARTED' | 'UPLOAD_COMPLETION_IN_PROGRESS' | 'UPLOAD_COMPLETION_SUCCEEDED' | 'UPLOAD_COMPLETION_FAILED';
  status_message: string | null;
  expires_at: string;
}

export interface LabelGroup {
  id: string;
  name: string;
  values: Array<{ id: string; name: string }>;
  links: Record<string, string>;
}

export type PermissionAccess = 'view' | 'edit' | 'comment' | 'delete';

export interface AssetListParams {
  type?: AssetType[];
  folder_id?: string;
  include_subfolder_assets?: boolean;
  search_text?: string;
  campaign_id?: string;
  created_at__from?: string;
  created_at__to?: string;
  modified_at__from?: string;
  modified_at__to?: string;
  offset?: number;
  page_size?: number;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class CmpLibraryClient {
  private cachedToken: { access_token: string; expires_at: number } | null = null;

  constructor(
    private clientId = CMP_CLIENT_ID,
    private clientSecret = CMP_CLIENT_SECRET,
    private apiBase = CMP_API_BASE,
    private tokenUrl = CMP_TOKEN_URL,
  ) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('CMP_CLIENT_ID and CMP_CLIENT_SECRET must be set in environment or passed to constructor');
    }
  }

  // ── Authentication ──────────────────────────────────────────────────────

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expires_at - 60_000) {
      return this.cachedToken.access_token;
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`CMP Auth failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    this.cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    return this.cachedToken.access_token;
  }

  private async request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = path.startsWith('http') ? path : `${this.apiBase}${path}`;

    let response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Retry on 401 (expired token)
    if (response.status === 401) {
      this.cachedToken = null;
      const newToken = await this.getAccessToken();
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CMP API Error ${response.status} on ${path}: ${errorText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // ── Assets ──────────────────────────────────────────────────────────────

  async listAssets(params: AssetListParams = {}): Promise<AssetListResponse> {
    const searchParams = new URLSearchParams();

    if (params.type) {
      for (const t of params.type) searchParams.append('type', t);
    }
    if (params.folder_id) searchParams.set('folder_id', params.folder_id);
    if (params.include_subfolder_assets !== undefined) {
      searchParams.set('include_subfolder_assets', String(params.include_subfolder_assets));
    }
    if (params.search_text) searchParams.set('search_text', params.search_text);
    if (params.campaign_id) searchParams.set('campaign_id', params.campaign_id);
    if (params.created_at__from) searchParams.set('created_at__from', params.created_at__from);
    if (params.created_at__to) searchParams.set('created_at__to', params.created_at__to);
    if (params.modified_at__from) searchParams.set('modified_at__from', params.modified_at__from);
    if (params.modified_at__to) searchParams.set('modified_at__to', params.modified_at__to);
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
    if (params.page_size !== undefined) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString();
    return this.request<AssetListResponse>(`/assets${query ? `?${query}` : ''}`);
  }

  async getAllAssets(params: Omit<AssetListParams, 'offset' | 'page_size'> = {}, pageSize = 50): Promise<Asset[]> {
    const allAssets: Asset[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.listAssets({ ...params, offset, page_size: pageSize });
      allAssets.push(...result.data);
      hasMore = result.pagination.next !== null;
      offset += pageSize;
    }

    return allAssets;
  }

  async getImage(id: string) {
    return this.request(`/images/${id}`);
  }

  async getVideo(id: string) {
    return this.request(`/videos/${id}`);
  }

  async getRawFile(id: string) {
    return this.request(`/raw-files/${id}`);
  }

  async getArticle(id: string) {
    return this.request(`/articles/${id}`);
  }

  async getStructuredContent(id: string) {
    return this.request(`/structured-contents/${id}`);
  }

  async updateImage(id: string, data: { title?: string; description?: string; folder_id?: string }) {
    return this.request(`/images/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async updateVideo(id: string, data: { title?: string; description?: string; folder_id?: string }) {
    return this.request(`/videos/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async updateRawFile(id: string, data: { title?: string; description?: string; folder_id?: string }) {
    return this.request(`/raw-files/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteImage(id: string) {
    return this.request(`/images/${id}`, { method: 'DELETE' });
  }

  async deleteVideo(id: string) {
    return this.request(`/videos/${id}`, { method: 'DELETE' });
  }

  async deleteRawFile(id: string) {
    return this.request(`/raw-files/${id}`, { method: 'DELETE' });
  }

  // ── Upload ──────────────────────────────────────────────────────────────

  async getUploadUrl(): Promise<UploadUrlResponse> {
    return this.request<UploadUrlResponse>('/upload-url');
  }

  async uploadAsset(filePath: string, title: string, folderId?: string): Promise<Asset> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Step 1: Get pre-signed URL
    const { url: presignedUrl, upload_meta_fields } = await this.getUploadUrl();

    // Step 2: Upload file to S3
    const fileBuffer = await fs.readFile(filePath);
    const formData = new FormData();

    // Meta fields must be in the same order as received
    formData.append('key', upload_meta_fields.key);
    formData.append('policy', upload_meta_fields.policy);
    formData.append('x-amz-algorithm', upload_meta_fields['x-amz-algorithm']);
    formData.append('x-amz-credential', upload_meta_fields['x-amz-credential']);
    formData.append('x-amz-date', upload_meta_fields['x-amz-date']);
    formData.append('x-amz-security-token', upload_meta_fields['x-amz-security-token']);
    formData.append('x-amz-signature', upload_meta_fields['x-amz-signature']);

    // File MUST be last
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, path.basename(filePath));

    const uploadResponse = await fetch(presignedUrl, { method: 'POST', body: formData });
    if (!uploadResponse.ok && uploadResponse.status !== 204) {
      throw new Error(`File upload failed: ${uploadResponse.status}`);
    }

    // Step 3: Create asset in library
    const payload: Record<string, unknown> = { key: upload_meta_fields.key, title };
    if (folderId) payload.folder_id = folderId;

    return this.request<Asset>('/assets', { method: 'POST', body: JSON.stringify(payload) });
  }

  async createMultipartUpload(fileSize: number, partSize?: number): Promise<MultipartUploadResponse> {
    const body: Record<string, unknown> = { file_size: fileSize };
    if (partSize) body.part_size = partSize;
    return this.request<MultipartUploadResponse>('/multipart-uploads', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getMultipartUploadStatus(id: string): Promise<MultipartUploadStatus> {
    return this.request<MultipartUploadStatus>(`/multipart-uploads/${id}/status`);
  }

  // ── Asset Versions ──────────────────────────────────────────────────────

  async addAssetVersion(assetId: string, key: string, title: string) {
    return this.request(`/assets/${assetId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ key, title }),
    });
  }

  // ── Asset Renditions ────────────────────────────────────────────────────

  async getAssetRenditions(assetId: string) {
    return this.request(`/assets/${assetId}/renditions`);
  }

  async getRendition(renditionId: string) {
    return this.request(`/renditions/${renditionId}`);
  }

  async getRenditionConfig(configId: string) {
    return this.request(`/rendition-configs/${configId}`);
  }

  // ── Asset Fields ────────────────────────────────────────────────────────

  async getAssetFields(assetId: string) {
    return this.request(`/assets/${assetId}/fields`);
  }

  async replaceAssetFields(assetId: string, fields: Array<{ id: string; value: unknown }>) {
    return this.request(`/assets/${assetId}/fields`, {
      method: 'PUT',
      body: JSON.stringify({ data: fields }),
    });
  }

  async updateAssetField(assetId: string, fieldId: string, value: unknown) {
    return this.request(`/assets/${assetId}/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  // ── Asset Lineages ──────────────────────────────────────────────────────

  async addAssetLineage(assetId: string, url: string, name: string) {
    return this.request(`/assets/${assetId}/lineages`, {
      method: 'POST',
      body: JSON.stringify({ url, name }),
    });
  }

  async listAssetLineages(assetId?: string) {
    const query = assetId ? `?asset_id=${assetId}` : '';
    return this.request(`/asset-lineages${query}`);
  }

  async deleteAssetLineage(assetId: string, lineageId: string) {
    return this.request(`/assets/${assetId}/lineages/${lineageId}`, { method: 'DELETE' });
  }

  // ── Download URLs ───────────────────────────────────────────────────────

  async getFileUrls(fileGuids: string[]) {
    return this.request('/file-urls', {
      method: 'POST',
      body: JSON.stringify({ file_guids: fileGuids }),
    });
  }

  // ── Folders ─────────────────────────────────────────────────────────────

  async listFolders(parentFolderId?: string, offset = 0, pageSize = 50): Promise<PaginatedResponse<Folder>> {
    const params = new URLSearchParams({ offset: String(offset), page_size: String(pageSize) });
    if (parentFolderId) params.set('parent_folder_id', parentFolderId);
    return this.request<PaginatedResponse<Folder>>(`/folders?${params}`);
  }

  async getFolder(id: string): Promise<Folder> {
    return this.request<Folder>(`/folders/${id}`);
  }

  async createFolder(name: string, parentFolderId?: string): Promise<Folder> {
    const body: Record<string, unknown> = { name };
    if (parentFolderId) body.parent_folder_id = parentFolderId;
    return this.request<Folder>('/folders', { method: 'POST', body: JSON.stringify(body) });
  }

  async updateFolder(id: string, data: { name?: string; parent_folder_id?: string }): Promise<Folder> {
    return this.request<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteFolder(id: string) {
    return this.request(`/folders/${id}`, { method: 'DELETE' });
  }

  // ── Folder Permissions ──────────────────────────────────────────────────

  async listFolderPermissions(folderId: string, access?: PermissionAccess) {
    const params = access ? `?access=${access}` : '';
    return this.request(`/folders/${folderId}/permissions${params}`);
  }

  async grantFolderPermissions(
    folderId: string,
    accessors: Array<{ id: string; type: 'user' | 'team'; access: PermissionAccess }>,
  ) {
    return this.request(`/folders/${folderId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ accessors }),
    });
  }

  async updateFolderPermission(folderId: string, accessorId: string, access: PermissionAccess) {
    return this.request(`/folders/${folderId}/permissions/${accessorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ access }),
    });
  }

  async removeFolderPermission(folderId: string, accessorId: string) {
    return this.request(`/folders/${folderId}/permissions/${accessorId}`, { method: 'DELETE' });
  }

  // ── Asset Permissions ───────────────────────────────────────────────────

  async listAssetPermissions(assetId: string, access?: PermissionAccess) {
    const params = access ? `?access=${access}` : '';
    return this.request(`/assets/${assetId}/permissions${params}`);
  }

  async grantAssetPermissions(
    assetId: string,
    accessors: Array<{ id: string; type: 'user' | 'team'; access: PermissionAccess }>,
  ) {
    return this.request(`/assets/${assetId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ accessors }),
    });
  }

  async updateAssetPermission(assetId: string, accessorId: string, access: PermissionAccess) {
    return this.request(`/assets/${assetId}/permissions/${accessorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ access }),
    });
  }

  async removeAssetPermission(assetId: string, accessorId: string) {
    return this.request(`/assets/${assetId}/permissions/${accessorId}`, { method: 'DELETE' });
  }

  // ── Labels ──────────────────────────────────────────────────────────────

  async listLabelGroups(sourceOrgType?: 'current' | 'related'): Promise<PaginatedResponse<LabelGroup>> {
    const params = sourceOrgType ? `?source_org_type=${sourceOrgType}` : '';
    return this.request<PaginatedResponse<LabelGroup>>(`/label-groups${params}`);
  }

  // ── Structured Content ──────────────────────────────────────────────────

  async createStructuredContent(data: Record<string, unknown>) {
    return this.request('/structured-contents', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateStructuredContent(id: string, data: Record<string, unknown>) {
    return this.request(`/structured-contents/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
}
