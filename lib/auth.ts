import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const ADMIN_ID = process.env.ADMIN_ID || "admin";
const ADMIN_PW = process.env.ADMIN_PW || "";
const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod";

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
