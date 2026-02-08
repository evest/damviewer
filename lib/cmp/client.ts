import "server-only";

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

export async function cmpFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`CMP API request failed: ${res.status} ${res.statusText} (${path})`);
  }

  return res.json();
}
