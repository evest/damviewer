# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DAMViewer is a Digital Asset Management viewer built on Next.js 16. It connects to Optimizely Content Graph to browse, search, and filter image, video, and raw file assets.

## Commands

- `npm run dev` — Start development server (localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (flat config, v9)

No test framework is configured yet.

## Tech Stack

- **Next.js 16** with App Router (all routes under `app/`)
- **React 19** with server components by default
- **TypeScript 5.9** (strict mode)
- **Tailwind CSS 4** via PostCSS plugin (`@tailwindcss/postcss`)
- **shadcn/ui** (new-york style) — primitives in `components/ui/`
- **ESLint 9** with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- **lucide-react** for icons, **react-file-icon** for MIME-based file type icons

## Architecture

### Routing & Pages

- `app/layout.tsx` — Root layout with Geist fonts and metadata
- `app/page.tsx` — Browse page (server component): fetches assets and facets, renders grid with sidebar filters
- `app/assets/[id]/page.tsx` — Asset detail page with preview, metadata sidebar, and rendition list
- `app/error.tsx` / `app/loading.tsx` — Error boundary and loading skeleton

### Data Layer

- `lib/graphql/client.ts` — Server-only GraphQL client (`import "server-only"`) that calls Optimizely Content Graph
- `lib/graphql/queries.ts` — GraphQL queries: `ASSETS_LIST_QUERY`, `ASSET_DETAIL_QUERY`, `ASSETS_FACETS_QUERY`
- `lib/graphql/filters.ts` — Builds `where` clauses from URL search params (search, type, tags, created date)
- `lib/types/asset.ts` — TypeScript interfaces for `Asset`, `ImageAsset`, `VideoAsset`, `RawFileAsset`
- `lib/constants.ts` — Helpers: `isImage()`, `isVideo()`, `isPreviewable()`, `isExpired()`, `formatDate()`, `damLoader()`

### API Routes

- `app/api/assets/route.ts` — GET proxy for asset listing (accepts `limit`, `cursor`, `q`, `type`, `tags`, `created`)
- `app/api/assets/[id]/route.ts` — GET proxy for single asset by ID

### Components

- `app/components/assets/` — `AssetGrid`, `AssetCard`, `AssetDetail`, `RenditionList`
- `app/components/layout/` — `Header`, `Sidebar` (desktop sidebar + mobile bottom sheet filters)
- `app/components/ui/` — `DamImage`, `FileTypeIcon`, `Pagination`, `SearchInput`
- `components/ui/` — shadcn primitives (badge, button, card, input, scroll-area, separator, sheet, skeleton)

### Key Patterns

- **URL-driven state**: All search, filter, and pagination state lives in URL search params
- **Server-first data**: Browse page is a server component; data flows as props to client components
- **Content Graph API**: Endpoint configured via `CONTENT_GRAPH_ENDPOINT` env var, auth via `CONTENT_GRAPH_AUTH_TOKEN` query param
- **Asset types**: `PublicImageAsset`, `PublicVideoAsset`, `PublicRawFileAsset` (discriminated by `__typename`)
- **Image host**: `files.alloytours.com` (configured in `next.config.ts` remotePatterns)

### Environment Variables (`.env.local`)

- `CONTENT_GRAPH_ENDPOINT` — Content Graph base URL
- `CONTENT_GRAPH_AUTH_TOKEN` — Auth token appended as query param
- `INCLUDE_STRUCTURED_CONTENT` — When `"true"`, includes `application/cmp+structured-content` assets

## Path Alias

- `@/*` maps to the project root
