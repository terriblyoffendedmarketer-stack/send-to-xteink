import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Storage not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 50MB)" },
      { status: 400 }
    );
  }

  const blob = await put(`books/${file.name}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
  });
}
