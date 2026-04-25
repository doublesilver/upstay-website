import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "upstay_admin_token";
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX = 5;
const WINDOW = 15 * 60 * 1000;

async function verifyJwtEdge(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/auth" && req.method === "POST") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const rec = attempts.get(ip);
    if (!rec || now > rec.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW });
      return NextResponse.next();
    }
    rec.count++;
    if (rec.count > MAX) {
      return NextResponse.json(
        { error: "너무 많은 시도. 잠시 후 다시 시도하세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rec.resetAt - now) / 1000)),
          },
        },
      );
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

export const config = { matcher: ["/api/auth", "/admin/:path*"] };
