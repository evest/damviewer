# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DAMViewer is a Next.js 16 application bootstrapped with Create Next App. Currently a starter project intended to become a Digital Asset Management viewer.

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
- **ESLint 9** with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`

## Architecture

- `app/layout.tsx` — Root layout (server component), sets up Geist fonts and metadata
- `app/page.tsx` — Home page
- `app/globals.css` — Tailwind v4 import + CSS custom properties for light/dark theme
- Path alias: `@/*` maps to the project root
