import "server-only";
import type { CmpPaginatedResponse } from "./types";

const API_BASE = process.env.CMP_API_BASE_URL || "https://api.cmp.optimizely.com/v3";
const TOKEN_URL =
  process.env.CMP_AUTH_TOKEN_URL || "https://accounts.cmp.optimizely.com/o/oauth2/v1/token";
const CLIENT_ID = process.env.CMP_APP_CLIENT_ID!;
const CLIENT_SECRET = process.env.CMP_APP_CLIENT_SECRET!;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`CMP token request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Expire 60 seconds early to avoid edge-case failures
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export class CmpApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    path: string
  ) {
    super(`CMP API request failed: ${status} (${path}) ${body}`);
  }
}

/** Write-back is opt-in, since the app itself has no authentication. */
export function isCmpWriteEnabled(): boolean {
  return process.env.ENABLE_CMP_WRITE === "true";
}

/**
 * Calls the CMP REST API. Accepts a path relative to the v3 base or an absolute
 * URL (e.g. a `pagination.next` link). Plain GETs are cached for 60 seconds;
 * pass `cache: "no-store"` to read fresh data, e.g. right before editing.
 */
export async function cmpFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const isCachedRead = !init.method && !init.cache;

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    ...(isCachedRead ? { next: { revalidate: 60 } } : {}),
  });

  if (!res.ok) {
    throw new CmpApiError(res.status, await res.text(), path);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}

/** Follows `pagination.next` links and returns every item. */
export async function cmpFetchAll<T>(path: string, init: RequestInit = {}): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = path;
  while (next) {
    const page: CmpPaginatedResponse<T> = await cmpFetch(next, init);
    items.push(...page.data);
    next = page.pagination.next;
  }
  return items;
}
