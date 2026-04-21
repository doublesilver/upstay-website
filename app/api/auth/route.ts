import { NextRequest } from "next/server";
import { verifyCredentials, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { id, password } = await req.json();
  if (!verifyCredentials(id, password)) {
    return Response.json(
      { error: "아이디 또는 비밀번호를 다시 확인해주세요" },
      { status: 401 },
    );
  }
  return Response.json({ token: createToken() });
}
