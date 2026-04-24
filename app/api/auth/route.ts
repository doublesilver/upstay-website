import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createToken,
  setAuthCookie,
  clearAuthCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { id, password } = await req.json();
  if (!verifyCredentials(id, password)) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호를 다시 확인해주세요" },
      { status: 401 },
    );
  }
  const token = await createToken();
  const res = NextResponse.json({ token });
  setAuthCookie(res, token);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}
