import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE = "upstay_admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `환경변수 ${key}가 설정되지 않았습니다. Railway Variables에 반드시 추가하세요.`,
    );
  }
  return val;
}

export function verifyCredentials(id: string, pw: string): boolean {
  return id === requireEnv("ADMIN_ID") && pw === requireEnv("ADMIN_PW");
}

function getSecret(): Uint8Array {
  const secret = requireEnv("JWT_SECRET");
  if (secret.length < 32) {
    throw new Error("JWT_SECRET은 최소 32자 이상이어야 합니다");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyToken(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
  const auth = req.headers.get("authorization");
  const bearerToken = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const token = cookieToken || bearerToken;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
