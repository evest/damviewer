const TYPE_PREFIXES: Record<string, string[]> = {
  image: ["image/"],
  video: ["video/"],
  raw: ["application/", "text/"],
};

function getDateFrom(created: string): string | undefined {
  const now = new Date();
  switch (created) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "month":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
    case "3months":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
    case "6months":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString();
    default:
      return undefined;
  }
}

export function buildWhereClause(params: {
  q?: string;
  type?: string;
  tags?: string;
  created?: string;
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

  if (params.created) {
    const dateFrom = getDateFrom(params.created);
    if (dateFrom) {
      conditions.push({ DateCreated: { gte: dateFrom } });
    }
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}
