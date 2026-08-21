# Send to XTEink

Upload files from any device, download on your XTEink e-reader via OPDS.

## Status

- [x] Upload UI with drag-and-drop (desktop + mobile)
- [x] OPDS feed endpoint (`/opds`) compatible with CrossPoint firmware
- [x] HTTP Basic auth on all routes (works with CrossPoint's OPDS auth)
- [x] Vercel Blob storage for uploaded files
- [x] File management (list, delete)
- [x] Deploy to Vercel with Blob store provisioned
- [x] Configure OPDS server on XTEink device
- [x] PWA manifest and service worker
- [x] Accept all file types (not just EPUB)
- [x] Download proxy for ESP32-C3 compatibility
- [x] Capacitor Android APK wrapper

## How it works

1. User opens the web app from any device, uploads files
2. Files are stored in Vercel Blob
3. The `/opds` endpoint serves an OPDS acquisition feed listing all uploaded books
4. On the XTEink device: Settings > System > OPDS Servers > add the app URL + credentials
5. Browse the OPDS catalog on the device over any WiFi to download books

## File map

- `src/app/page.tsx` — Upload UI (drag-and-drop, file list, delete)
- `src/app/api/upload/route.ts` — POST endpoint for file uploads to Vercel Blob
- `src/app/api/files/route.ts` — GET (list files), DELETE (remove file)
- `src/app/opds/route.ts` — OPDS Atom/XML acquisition feed
- `src/app/opds/download/route.ts` — Download proxy (ESP32-C3 can't fetch external HTTPS)
- `src/middleware.ts` — HTTP Basic auth on all routes (excludes PWA assets)
- `src/app/layout.tsx` — Root layout with PWA meta tags and service worker registration
- `src/app/globals.css` — Tailwind CSS with light/dark theme and safe-area padding
- `public/manifest.json` — PWA manifest with share_target
- `public/sw.js` — Service worker (install + activate + fetch handlers)
- `public/icon-192.png`, `public/icon-512.png` — PWA icons
- `android-wrapper/` — Capacitor Android APK wrapper
- `android-wrapper/capacitor.config.json` — Points to production Vercel URL
- `.github/workflows/build-apk.yml` — GitHub Actions workflow to build APK
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

## Deployment

- Live: https://send-to-xteink.vercel.app
- Vercel project: chilling1/send-to-xteink
- GitHub: https://github.com/terriblyoffendedmarketer-stack/send-to-xteink
- APK: built by GitHub Actions, download from Actions artifacts tab

## Gotchas

- CrossPoint OPDS auth must be set to HTTP Basic (not Digest)
- Vercel Blob URLs are public (unguessable) — the auth protects the catalog, not individual file URLs
- The OPDS feed serves `application/atom+xml` content type which CrossPoint expects
- `addRandomSuffix: false` on blob uploads means re-uploading the same filename overwrites
- ESP32-C3 can't download from external HTTPS domains — downloads are proxied through `/opds/download`
- PWA install requires: fetch handler in sw.js + manifest/sw/icons excluded from auth middleware
- Capacitor config must be `.json` not `.ts` to avoid ESM issues
