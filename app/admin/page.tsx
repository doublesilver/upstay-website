import { redirect } from "next/navigation";

// /admin 진입 시 곧바로 사례 관리로. 인증 미통과 시 middleware가 로그인 폼으로 다시 보냄.
export default function AdminPage() {
  redirect("/admin/remodeling");
}
