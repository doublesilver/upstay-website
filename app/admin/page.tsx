"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 인증된 상태에서 /admin 직접 진입 시 즉시 사례 관리로 이동.
// 인증 미통과 시 layout이 자체 로그인 폼을 렌더하므로 이 컴포넌트는 안 보임.
export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/remodeling");
  }, [router]);
  return null;
}
