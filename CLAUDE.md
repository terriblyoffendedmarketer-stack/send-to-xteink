# Send to XTEink

Upload EPUBs from any device, download on your XTEink e-reader via OPDS.

## Status

- [x] Upload UI with drag-and-drop (desktop + mobile)
- [x] OPDS feed endpoint (`/opds`) compatible with CrossPoint firmware
- [x] HTTP Basic auth on all routes (works with CrossPoint's OPDS auth)
- [x] Vercel Blob storage for uploaded files
- [x] File management (list, delete)
- [x] Deploy to Vercel with Blob store provisioned
- [ ] Configure OPDS server on XTEink device
- [ ] PWA manifest for mobile share sheet

## How it works

1. User opens the web app from any device, uploads EPUBs
2. Files are stored in Vercel Blob
3. The `/opds` endpoint serves an OPDS acquisition feed listing all uploaded books
4. On the XTEink device: Settings > System > OPDS Servers > add the app URL + credentials
5. Browse the OPDS catalog on the device over any WiFi to download books

## File map

- `src/app/page.tsx` — Upload UI (drag-and-drop, file list, delete)
- `src/app/api/upload/route.ts` — POST endpoint for EPUB uploads to Vercel Blob
- `src/app/api/files/route.ts` — GET (list files), DELETE (remove file)
- `src/app/opds/route.ts` — OPDS Atom/XML acquisition feed
- `src/middleware.ts` — HTTP Basic auth on all routes
- `.env.example` — Required environment variables

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in BLOB_READ_WRITE_TOKEN from Vercel Blob store
# Set AUTH_USERNAME and AUTH_PASSWORD
npm run dev
```

## Environment variables

- `AUTH_USERNAME` — Basic auth username (used for web UI and OPDS)
- `AUTH_PASSWORD` — Basic auth password
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token

## Gotchas

- CrossPoint OPDS auth must be set to HTTP Basic (not Digest)
- Vercel Blob URLs are public (unguessable) — the auth protects the catalog, not individual file URLs
- The OPDS feed serves `application/atom+xml` content type which CrossPoint expects
- `addRandomSuffix: false` on blob uploads means re-uploading the same filename overwrites
