# DAM Viewer

A Digital Asset Management viewer for Optimizely DAM, built with Next.js. Browse, search, and filter assets from the Alloy Tours DAM library through a responsive web interface.

## Features

- **Browse** assets in a responsive grid (images, videos, raw files)
- **Search** with debounced full-text search
- **Filter** by asset type, tags, and created date
- **Detail pages** with full metadata, labels, custom fields, and renditions
- **Image optimization** via CDN-side resizing (custom Next.js image loader)
- **Server-side data fetching** keeps the Content Graph auth token secret

## Tech Stack

- Next.js 16 (App Router, server components)
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- shadcn/ui (New York style)
- Optimizely Content Graph (GraphQL)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and add your Content Graph credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|---|---|
| `CONTENT_GRAPH_ENDPOINT` | Optimizely Content Graph endpoint URL |
| `CONTENT_GRAPH_AUTH_TOKEN` | Authentication token for Content Graph |
| `INCLUDE_STRUCTURED_CONTENT` | Include structured content assets in listings (default: `false`) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
  page.tsx                    # Browse page (server component)
  loading.tsx                 # Browse skeleton
  error.tsx                   # Error boundary
  assets/[id]/page.tsx        # Asset detail page
  api/assets/route.ts         # Assets list API proxy
  api/assets/[id]/route.ts    # Asset detail API proxy
  components/
    assets/                   # AssetCard, AssetGrid, AssetDetail, RenditionList
    layout/                   # Header, Sidebar
    ui/                       # SearchInput, Pagination, DamImage
lib/
  graphql/client.ts           # Server-only GraphQL fetch wrapper
  graphql/queries.ts          # GraphQL query strings
  graphql/filters.ts          # Where clause builder
  types/asset.ts              # TypeScript types
  constants.ts                # Helpers (pagination, MIME types, image loader)
components/ui/                # shadcn/ui components
```

## Architecture

**Initial page load**: Server component fetches data from Content Graph via `graphqlFetch()` and renders HTML directly.

**Client interactions** (search, filter, paginate): URL search params change triggers a server component re-render with fresh data. The auth token never reaches the client.

Pagination uses Content Graph's cursor-based system. Filters support combining type, tags, date range, and full-text search via `_and`/`_or` GraphQL clauses.
