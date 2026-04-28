import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE = "upstay_admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminId(): string {
  const v = process.env.ADMIN_ID;
  if (!v) throw new Error("ADMIN_ID 환경변수가 설정되지 않았습니다");
  return v;
}

function getAdminPw(): string {
  const v = process.env.ADMIN_PW;
  if (!v) throw new Error("ADMIN_PW 환경변수가 설정되지 않았습니다");
  return v;
}

function getSecretBytes(): Uint8Array {
  const v = process.env.JWT_SECRET;
  if (!v || v.length < 32) {
    throw new Error(
      "JWT_SECRET 환경변수가 설정되지 않았거나 32자 미만입니다 (취약)",
    );
  }
  return new TextEncoder().encode(v);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function verifyCredentials(id: string, pw: string): boolean {
  const idOk = timingSafeEqualString(id, getAdminId());
  const pwOk = timingSafeEqualString(pw, getAdminPw());
  return idOk && pwOk;
}

export async function createToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setJti(crypto.randomUUID())
    .sign(getSecretBytes());
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
    await jwtVerify(token, getSecretBytes());
    return true;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
