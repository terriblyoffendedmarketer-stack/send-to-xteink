import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Storage not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  const contentLength = parseInt(request.headers.get("content-length") || "0");
  if (contentLength > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 100MB)" },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 100MB)" },
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
