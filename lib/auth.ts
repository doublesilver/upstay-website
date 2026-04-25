import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE = "upstay_admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export const ADMIN_ID = "upstay";
export const ADMIN_PW = "0426";
export const JWT_SECRET = "upstay-personal-site-jwt-secret-2026-fixed-key";

export function verifyCredentials(id: string, pw: string): boolean {
  return id === ADMIN_ID && pw === ADMIN_PW;
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
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
  const token = req.cookies.get(AUTH_COOKIE)?.value;
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
