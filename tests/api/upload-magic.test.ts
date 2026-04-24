import { beforeAll, describe, expect, test } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { setupTempDataDir } from "../api-helpers";

let token: string;

beforeAll(async () => {
  setupTempDataDir();
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
});

describe("/api/admin/upload magic number validation", () => {
  test("rejects PNG extension file containing JPEG magic bytes with 400", async () => {
    const { POST } = await import("../../app/api/admin/upload/route");

    // JPEG magic: FF D8 FF
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    ]);
    const form = new FormData();
    form.append(
      "files",
      new Blob([jpegBytes], { type: "image/jpeg" }),
      "fake.png",
    );

    const req = new NextRequest("http://localhost/api/admin/upload", {
      method: "POST",
      body: form,
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toMatch(/일치하지 않습니다/);
  });

  test("rejects JPEG extension file containing PNG magic bytes with 400", async () => {
    const { POST } = await import("../../app/api/admin/upload/route");

    // PNG magic: 89 50 4E 47
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const form = new FormData();
    form.append(
      "files",
      new Blob([pngBytes], { type: "image/png" }),
      "fake.jpg",
    );

    const req = new NextRequest("http://localhost/api/admin/upload", {
      method: "POST",
      body: form,
      headers: { authorization: `Bearer ${token}` },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toMatch(/일치하지 않습니다/);
  });

  test("rejects upload without valid token with 401", async () => {
    const { POST } = await import("../../app/api/admin/upload/route");

    const form = new FormData();
    form.append(
      "files",
      new Blob([new Uint8Array([0xff, 0xd8, 0xff])]),
      "photo.jpg",
    );

    const req = new NextRequest("http://localhost/api/admin/upload", {
      method: "POST",
      body: form,
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });
});
