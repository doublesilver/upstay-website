import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "upstay_admin_token";

function getSecretBytes(): Uint8Array | null {
  const v = process.env.JWT_SECRET;
  if (!v || v.length < 32) return null;
  return new TextEncoder().encode(v);
}

async function verifyJwtEdge(token: string): Promise<boolean> {
  const secret = getSecretBytes();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/admin/")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const valid = token ? await verifyJwtEdge(token) : false;
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const valid = token ? await verifyJwtEdge(token) : false;
    if (!valid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      const res = NextResponse.redirect(url);
      if (token) {
        res.cookies.set({ name: AUTH_COOKIE, value: "", maxAge: 0, path: "/" });
      }
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
