import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const auth = request.headers.get("authorization");

  if (!auth || !auth.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Send to XTEink"' },
    });
  }

  try {
    const decoded = atob(auth.split(" ")[1]);
    const colon = decoded.indexOf(":");
    if (colon === -1) throw new Error("invalid");

    const username = decoded.slice(0, colon);
    const password = decoded.slice(colon + 1);

    if (
      username !== process.env.AUTH_USERNAME ||
      password !== process.env.AUTH_PASSWORD
    ) {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Send to XTEink"' },
      });
    }
  } catch {
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Send to XTEink"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-192.png|icon-512.png|send-to-xteink\\.apk).*)"],
};
