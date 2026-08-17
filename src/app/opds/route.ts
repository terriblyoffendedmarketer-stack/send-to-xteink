import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function titleFromPathname(pathname: string): string {
  return pathname.replace(/^books\//, "").replace(/\.epub$/i, "");
}

export async function GET(request: Request) {
  const blobs = process.env.BLOB_READ_WRITE_TOKEN
    ? (await list({ prefix: "books/" })).blobs
    : [];

  const sorted = [...blobs].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  const baseUrl = new URL(request.url).origin;
  const updated =
    sorted.length > 0
      ? new Date(sorted[0].uploadedAt).toISOString()
      : new Date().toISOString();

  const entries = sorted
    .map((blob) => {
      const title = titleFromPathname(blob.pathname);
      return `  <entry>
    <title>${escapeXml(title)}</title>
    <id>${escapeXml(blob.url)}</id>
    <updated>${new Date(blob.uploadedAt).toISOString()}</updated>
    <content type="text">${escapeXml(title)} (${formatSize(blob.size)})</content>
    <link rel="http://opds-spec.org/acquisition"
          href="${baseUrl}/opds/download?url=${encodeURIComponent(blob.url)}"
          type="application/epub+zip"
          length="${blob.size}"/>
  </entry>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:crosspoint-send</id>
  <title>Send to XTEink</title>
  <updated>${updated}</updated>
  <author>
    <name>CrossPoint Send</name>
  </author>
  <link rel="self"
        href="${baseUrl}/opds"
        type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
  <link rel="start"
        href="${baseUrl}/opds"
        type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
${entries}
</feed>`;

  return new NextResponse(feed, {
    headers: {
      "Content-Type":
        "application/atom+xml;profile=opds-catalog;kind=acquisition",
    },
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
