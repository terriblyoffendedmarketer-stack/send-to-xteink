import { list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json([]);
  }

  const { blobs } = await list({ prefix: "books/" });

  const files = blobs.map((blob) => ({
    url: blob.url,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  }));

  files.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return NextResponse.json(files);
}

export async function DELETE(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  await del(url);
  return NextResponse.json({ deleted: true });
}
