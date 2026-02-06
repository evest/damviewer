const TYPE_PREFIXES: Record<string, string[]> = {
  image: ["image/"],
  video: ["video/"],
  raw: ["application/", "text/"],
};

export function buildWhereClause(params: {
  q?: string;
  type?: string;
  tags?: string;
}): Record<string, unknown> | undefined {
  const conditions: Record<string, unknown>[] = [];

  if (params.q) {
    conditions.push({ _fulltext: { match: params.q } });
  }

  if (params.type) {
    const types = params.type.split(",").filter(Boolean);
    const mimeConditions: Record<string, unknown>[] = [];
    for (const t of types) {
      const prefixes = TYPE_PREFIXES[t];
      if (prefixes) {
        for (const prefix of prefixes) {
          mimeConditions.push({ MimeType: { startsWith: prefix } });
        }
      }
    }
    if (mimeConditions.length === 1) {
      conditions.push(mimeConditions[0]);
    } else if (mimeConditions.length > 1) {
      conditions.push({ _or: mimeConditions });
    }
  }

  if (params.tags) {
    const tagNames = params.tags.split(",").filter(Boolean);
    if (tagNames.length > 0) {
      conditions.push({ Tags: { Name: { in: tagNames } } });
    }
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}
