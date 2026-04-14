import { NextRequest } from "next/server";
import { verifyCredentials, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { id, password } = await req.json();
  if (!verifyCredentials(id, password)) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
  return Response.json({ token: createToken() });
}
