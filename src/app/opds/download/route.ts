import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const res = await fetch(blobUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Download failed" }, { status: 502 });
  }

  const filename =
    blobUrl.split("/").pop()?.replace(/\?.*$/, "") || "book.epub";

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(res.headers.get("content-length")
        ? { "Content-Length": res.headers.get("content-length")! }
        : {}),
    },
  });
}
