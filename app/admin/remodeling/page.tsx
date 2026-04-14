"use client";

import { useEffect, useState } from "react";

interface Case {
  id: number;
  before_image: string;
  after_image: string;
  title: string;
  sort_order: number;
  show_on_main: number;
}

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

export default function RemodelingAdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [editing, setEditing] = useState<Case | null>(null);
  const [msg, setMsg] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const load = () => {
    fetch("/api/admin/remodeling", { headers: getHeaders() })
      .then((r) => r.json())
      .then(setCases);
  };

  useEffect(load, []);

  const handleSave = async () => {
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    await fetch("/api/admin/remodeling", {
      method,
      headers: getHeaders(),
      body: JSON.stringify(editing),
    });
    setEditing(null);
    setMsg("저장되었습니다");
    load();
    setTimeout(() => setMsg(""), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch("/api/admin/remodeling", {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    load();
  };

  const newCase = (): Case => ({
    id: 0,
    before_image: "",
    after_image: "",
    title: "",
    sort_order: cases.length + 1,
    show_on_main: 1,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-bold text-[#111]">
          리모델링 사례 관리
        </h1>
        <button
          onClick={() => setEditing(newCase())}
          className="bg-[#111] text-white rounded px-4 py-2 text-[13px] font-medium hover:bg-[#333] transition-colors"
        >
          + 새 사례
        </button>
      </div>

      {msg && <p className="text-[13px] text-green-600 mb-4">{msg}</p>}

      {editing && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-6 max-w-2xl">
          <h2 className="text-[16px] font-medium mb-4">
            {editing.id ? "사례 수정" : "새 사례 추가"}
          </h2>

          <label className="block text-[13px] font-medium text-[#111] mb-1">
            제목
          </label>
          <input
            type="text"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] mb-3 outline-none focus:border-[#111]"
          />

          <label className="block text-[13px] font-medium text-[#111] mb-1">
            Before 이미지 URL
          </label>
          <input
            type="text"
            value={editing.before_image}
            onChange={(e) =>
              setEditing({ ...editing, before_image: e.target.value })
            }
            className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] mb-3 outline-none focus:border-[#111]"
          />

          <label className="block text-[13px] font-medium text-[#111] mb-1">
            After 이미지 URL
          </label>
          <input
            type="text"
            value={editing.after_image}
            onChange={(e) =>
              setEditing({ ...editing, after_image: e.target.value })
            }
            className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] mb-3 outline-none focus:border-[#111]"
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[13px] font-medium text-[#111] mb-1">
                정렬 순서
              </label>
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) =>
                  setEditing({ ...editing, sort_order: Number(e.target.value) })
                }
                className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] outline-none focus:border-[#111]"
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={editing.show_on_main === 1}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      show_on_main: e.target.checked ? 1 : 0,
                    })
                  }
                />
                메인 페이지 노출
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-[#111] text-white rounded px-5 py-2 text-[13px] font-medium hover:bg-[#333] transition-colors"
            >
              저장
            </button>
            <button
              onClick={() => setEditing(null)}
              className="border border-[#E5E7EB] rounded px-5 py-2 text-[13px] hover:bg-[#F9FAFB] transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                순서
              </th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                제목
              </th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                메인 노출
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6B7280]">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[#E5E7EB] last:border-0"
              >
                <td className="px-4 py-3">{c.sort_order}</td>
                <td className="px-4 py-3">{c.title || "-"}</td>
                <td className="px-4 py-3">{c.show_on_main ? "O" : "X"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(c)}
                    className="text-[#6B7280] hover:text-[#111] mr-3"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[#6B7280]"
                >
                  등록된 사례가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
