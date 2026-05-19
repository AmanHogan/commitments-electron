# Commitment Tracker — Electron Setup Guide

## Prerequisites

- Node.js 20+
- npm

## First-time setup

```bash
# 1. Install all dependencies
npm install

# 2. Rebuild native modules for Electron (REQUIRED after every npm install)
npm run postinstall
```

> **Why step 2?** `better-sqlite3` is a native Node.js module. Electron ships its
> own version of Node, so the module must be recompiled against it. The
> `postinstall` script runs `electron-builder install-app-deps` which does this
> automatically.

## Running in development

```bash
npm run dev
```

Opens the Electron window with hot-reload. DevTools can be opened with F12.

## Building for production

```bash
# macOS (universal)
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Key dependencies

| Package | Purpose |
|---|---|
| `better-sqlite3` | SQLite database — runs in the Electron main process |
| `react-router-dom` | Client-side routing between pages |
| `tailwindcss` + `@tailwindcss/vite` | Tailwind CSS v4 (config-in-CSS approach) |
| `radix-ui` | Headless UI primitives used by shadcn components |
| `class-variance-authority` | Variant-based component styles (shadcn) |
| `clsx` + `tailwind-merge` | `cn()` utility for conditional class names |
| `lucide-react` | Icon set |
| `sonner` | Toast notifications |
| `jspdf` | PDF export for 1-on-1 documents |
| `docx` | Word document export for 1-on-1 documents |
| `zod` | Schema validation for business commitment forms |
| `tw-animate-css` | Tailwind animation utilities |

## Architecture

```
src/
├── main/
│   ├── index.ts       # Electron main process + IPC handlers
│   └── database.ts    # SQLite schema + CRUD helpers (better-sqlite3)
├── preload/
│   ├── index.ts       # contextBridge: exposes window.api to renderer
│   └── index.d.ts     # TypeScript types for window.api
└── renderer/src/
    ├── App.tsx                  # HashRouter + sidebar layout
    ├── pages/                   # Route components (load data, pass to page comps)
    ├── components/              # Page components + shadcn UI components
    │   └── ui/                  # shadcn primitives
    ├── lib/
    │   ├── actions.ts           # IPC wrappers (replaces Next.js server actions)
    │   ├── utils.ts             # cn() helper
    │   ├── utils/               # export-markdown, one-on-one-export
    │   └── mappers/             # businessCommitmentOneMapper
    ├── types/types.ts           # All TypeScript types and DTOs
    └── schemas/schemas.ts       # Zod schemas
```

## Data storage

The SQLite database is stored at:

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/commitments/commitments.db` |
| Windows | `%APPDATA%\commitments\commitments.db` |
| Linux | `~/.config/commitments/commitments.db` |

The database is created automatically on first launch.

## If you re-clone / fresh install

```bash
npm install
npm run postinstall   # rebuild better-sqlite3 for Electron
npm run dev
```

That's it — no backend server, no PostgreSQL, no Spring Boot required.
