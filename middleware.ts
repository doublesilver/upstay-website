import { NextRequest, NextResponse } from "next/server";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX = 10;
const WINDOW = 15 * 60 * 1000;

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== "/api/auth" || req.method !== "POST") {
    return NextResponse.next();
  }
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

export const config = { matcher: ["/api/auth"] };
