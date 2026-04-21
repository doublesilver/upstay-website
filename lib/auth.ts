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

export function createToken(): string {
  return jwt.sign({ role: "admin" }, requireEnv("JWT_SECRET"), {
    expiresIn: "7d",
  });
}

export function verifyToken(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    jwt.verify(auth.slice(7), requireEnv("JWT_SECRET"));
    return true;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
