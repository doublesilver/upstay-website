import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

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

function getJwtSecret(): string {
  const secret = requireEnv("JWT_SECRET");
  if (secret.length < 32) {
    throw new Error("JWT_SECRET은 최소 32자 이상이어야 합니다");
  }
  return secret;
}

export function createToken(): string {
  return jwt.sign({ role: "admin" }, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    jwt.verify(auth.slice(7), getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
