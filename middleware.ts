import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "upstay_admin_token";
const JWT_SECRET = "upstay-personal-site-jwt-secret-2026-fixed-key";
const SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

async function verifyJwtEdge(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET_BYTES);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

export const config = { matcher: ["/admin/:path*"] };
