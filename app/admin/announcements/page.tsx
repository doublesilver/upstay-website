"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_visible: number;
  created_at: string;
}

function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [msg, setMsg] = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const load = () => {
    fetch("/api/admin/announcements", { headers: getHeaders() })
      .then((r) => r.json())
      .then(setItems);
  };

  useEffect(load, []);

  const handleSave = async () => {
    if (!editing) return;
    const method = editing.id ? "PUT" : "POST";
    await fetch("/api/admin/announcements", {
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
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ id }),
    });
    load();
  };

  const newItem = (): Announcement => ({
    id: 0,
    title: "",
    content: "",
    is_visible: 1,
    created_at: "",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-bold text-[#111]">공지사항 관리</h1>
        <button
          onClick={() => setEditing(newItem())}
          className="bg-[#111] text-white rounded px-4 py-2 text-[13px] font-medium hover:bg-[#333] transition-colors"
        >
          + 새 공지
        </button>
      </div>

      {msg && <p className="text-[13px] text-green-600 mb-4">{msg}</p>}

      {editing && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-6 max-w-2xl">
          <h2 className="text-[16px] font-medium mb-4">
            {editing.id ? "공지 수정" : "새 공지 작성"}
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
            내용
          </label>
          <textarea
            value={editing.content}
            onChange={(e) =>
              setEditing({ ...editing, content: e.target.value })
            }
            rows={5}
            className="w-full border border-[#E5E7EB] rounded px-3 py-2 text-[14px] mb-3 outline-none focus:border-[#111] resize-none"
          />

          <label className="flex items-center gap-2 text-[13px] mb-4">
            <input
              type="checkbox"
              checked={editing.is_visible === 1}
              onChange={(e) =>
                setEditing({ ...editing, is_visible: e.target.checked ? 1 : 0 })
              }
            />
            공개
          </label>

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
                제목
              </th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                공개
              </th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7280]">
                작성일
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6B7280]">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#E5E7EB] last:border-0"
              >
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.is_visible ? "O" : "X"}</td>
                <td className="px-4 py-3 text-[#6B7280]">
                  {item.created_at?.slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(item)}
                    className="text-[#6B7280] hover:text-[#111] mr-3"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[#6B7280]"
                >
                  등록된 공지가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
