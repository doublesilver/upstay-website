import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const ADMIN_ID = "admin";
const ADMIN_PW = "upstay2026!";
const JWT_SECRET = "upstay-jwt-secret-key-2026";

export function verifyCredentials(id: string, pw: string): boolean {
  return id === ADMIN_ID && pw === ADMIN_PW;
}

export function createToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
