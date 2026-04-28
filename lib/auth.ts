import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const AUTH_COOKIE = "upstay_admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 8;

const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PW = process.env.ADMIN_PW;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_ID || !ADMIN_PW) {
  throw new Error("ADMIN_ID, ADMIN_PW 환경변수가 설정되지 않았습니다");
}
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET 환경변수가 설정되지 않았거나 32자 미만입니다 (취약)",
  );
}

const SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function verifyCredentials(id: string, pw: string): boolean {
  const idOk = timingSafeEqualString(id, ADMIN_ID!);
  const pwOk = timingSafeEqualString(pw, ADMIN_PW!);
  return idOk && pwOk;
}

export async function createToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setJti(crypto.randomUUID())
    .sign(SECRET_BYTES);
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
    await jwtVerify(token, SECRET_BYTES);
    return true;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
