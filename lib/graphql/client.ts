import "server-only";

const ENDPOINT = process.env.CONTENT_GRAPH_ENDPOINT!;
const AUTH_TOKEN = process.env.CONTENT_GRAPH_AUTH_TOKEN!;

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const url = `${ENDPOINT}&auth=${AUTH_TOKEN}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Content Graph request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}
