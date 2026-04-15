"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface SelectedElement {
  selector: string;
  tagName: string;
  path: string;
  text: string;
  styles: Record<string, string>;
}

interface StyleChange {
  selector: string;
  path: string;
  text: string;
  property: string;
  from: string;
  to: string;
}

const STYLE_GROUPS = [
  {
    label: "레이아웃",
    props: [
      { key: "width", label: "너비" },
      { key: "height", label: "높이" },
      { key: "paddingTop", label: "패딩 ↑" },
      { key: "paddingRight", label: "패딩 →" },
      { key: "paddingBottom", label: "패딩 ↓" },
      { key: "paddingLeft", label: "패딩 ←" },
      { key: "marginTop", label: "마진 ↑" },
      { key: "marginRight", label: "마진 →" },
      { key: "marginBottom", label: "마진 ↓" },
      { key: "marginLeft", label: "마진 ←" },
      { key: "gap", label: "간격" },
      { key: "borderRadius", label: "모서리" },
    ],
  },
  {
    label: "타이포그래피",
    props: [
      { key: "fontSize", label: "글자 크기" },
      { key: "fontWeight", label: "굵기" },
      { key: "lineHeight", label: "줄 높이" },
      { key: "letterSpacing", label: "자간" },
    ],
  },
  {
    label: "색상",
    props: [
      { key: "color", label: "글자색" },
      { key: "backgroundColor", label: "배경색" },
      { key: "borderColor", label: "테두리색" },
      { key: "borderWidth", label: "테두리" },
    ],
  },
];

const COLOR_PROPS = new Set(["color", "backgroundColor", "borderColor"]);

function cssToHex(color: string): string {
  if (color.startsWith("#"))
    return color.length === 4 || color.length === 7 ? color : "#000000";
  const m = color.match(/\d+/g);
  if (!m || m.length < 3) return "#000000";
  return (
    "#" +
    m
      .slice(0, 3)
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

const EDITOR_SCRIPT = `
(function() {
  var selectedEl = null;
  var hoverEl = null;

  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  var hoverOv = document.createElement('div');
  hoverOv.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid #3b82f6;background:rgba(59,130,246,0.08);display:none;transition:all 0.1s ease;';
  document.body.appendChild(hoverOv);

  var selectOv = document.createElement('div');
  selectOv.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border:2px solid #ef4444;background:rgba(239,68,68,0.06);display:none;';
  document.body.appendChild(selectOv);

  var tag = document.createElement('div');
  tag.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;background:#ef4444;color:#fff;font-size:10px;padding:1px 5px;border-radius:3px;font-family:monospace;display:none;white-space:nowrap;';
  document.body.appendChild(tag);

  function isEditor(el) { return el === hoverOv || el === selectOv || el === tag; }

  function getSelector(el) {
    if (!el || el === document.body) return 'body';
    var parts = [];
    var cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      var s = cur.tagName.toLowerCase();
      if (cur.id) { parts.unshift('#' + cur.id); break; }
      var p = cur.parentElement;
      if (p) {
        var sibs = Array.from(p.children).filter(function(c) { return c.tagName === cur.tagName; });
        if (sibs.length > 1) s += ':nth-of-type(' + (sibs.indexOf(cur) + 1) + ')';
      }
      parts.unshift(s);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function getPath(el) {
    var parts = [];
    var cur = el;
    while (cur && cur !== document.body) {
      var name = cur.tagName.toLowerCase();
      parts.unshift(name);
      cur = cur.parentElement;
      if (parts.length >= 4) break;
    }
    return parts.join(' > ');
  }

  function posOv(target, ov) {
    var r = target.getBoundingClientRect();
    ov.style.top = r.top + 'px';
    ov.style.left = r.left + 'px';
    ov.style.width = r.width + 'px';
    ov.style.height = r.height + 'px';
    ov.style.display = 'block';
  }

  var KEYS = ['width','height','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'marginTop','marginRight','marginBottom','marginLeft','gap',
    'fontSize','fontWeight','lineHeight','letterSpacing','color',
    'backgroundColor','borderColor','borderWidth','borderRadius'];

  function getStyles(el) {
    var cs = window.getComputedStyle(el);
    var r = {};
    KEYS.forEach(function(k) { r[k] = cs[k]; });
    return r;
  }

  function sendInfo(el) {
    var r = el.getBoundingClientRect();
    window.parent.postMessage({
      type: 'element-selected',
      data: {
        selector: getSelector(el),
        tagName: el.tagName.toLowerCase(),
        path: getPath(el),
        text: (el.textContent || '').trim().substring(0, 60),
        styles: getStyles(el)
      }
    }, '*');
  }

  document.addEventListener('mousemove', function(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isEditor(el)) return;
    if (el !== hoverEl) { hoverEl = el; posOv(el, hoverOv); }
  }, true);

  document.addEventListener('mouseleave', function() {
    hoverOv.style.display = 'none';
    hoverEl = null;
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isEditor(el)) return;
    selectedEl = el;
    posOv(el, selectOv);
    var r = el.getBoundingClientRect();
    tag.textContent = el.tagName.toLowerCase() + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
    tag.style.top = Math.max(0, r.top - 22) + 'px';
    tag.style.left = r.left + 'px';
    tag.style.display = 'block';
    sendInfo(el);
    return false;
  }, true);

  document.addEventListener('scroll', function() {
    if (selectedEl) {
      posOv(selectedEl, selectOv);
      var r = selectedEl.getBoundingClientRect();
      tag.style.top = Math.max(0, r.top - 22) + 'px';
      tag.style.left = r.left + 'px';
    }
    if (hoverEl) posOv(hoverEl, hoverOv);
  }, true);

  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'apply-style' && selectedEl) {
      selectedEl.style[e.data.property] = e.data.value;
      posOv(selectedEl, selectOv);
      var r = selectedEl.getBoundingClientRect();
      tag.textContent = selectedEl.tagName.toLowerCase() + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
      tag.style.top = Math.max(0, r.top - 22) + 'px';
      tag.style.left = r.left + 'px';
      window.parent.postMessage({ type: 'styles-updated', data: { styles: getStyles(selectedEl) } }, '*');
    }
    if (e.data.type === 'select-parent' && selectedEl && selectedEl.parentElement && selectedEl.parentElement !== document.documentElement) {
      selectedEl = selectedEl.parentElement;
      posOv(selectedEl, selectOv);
      var r2 = selectedEl.getBoundingClientRect();
      tag.textContent = selectedEl.tagName.toLowerCase() + ' ' + Math.round(r2.width) + 'x' + Math.round(r2.height);
      tag.style.top = Math.max(0, r2.top - 22) + 'px';
      tag.style.left = r2.left + 'px';
      sendInfo(selectedEl);
    }
  });
})();
`;

export default function VisualEditorPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [changes, setChanges] = useState<StyleChange[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"props" | "changes">("props");

  // Inject editor script into iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const inject = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc?.body) return;
        if (doc.getElementById("__ve_injected")) return;
        const marker = doc.createElement("div");
        marker.id = "__ve_injected";
        marker.style.display = "none";
        doc.body.appendChild(marker);
        const script = doc.createElement("script");
        script.textContent = EDITOR_SCRIPT;
        doc.head.appendChild(script);
      } catch (e) {
        console.error("Editor inject failed:", e);
      }
    };

    iframe.addEventListener("load", inject);
    inject();
    return () => iframe.removeEventListener("load", inject);
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "element-selected") {
        setSelected(e.data.data);
        setEditValues({});
        setTab("props");
      }
      if (e.data?.type === "styles-updated" && selected) {
        setSelected((prev) =>
          prev ? { ...prev, styles: e.data.data.styles } : null,
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [selected]);

  const applyStyle = useCallback(
    (property: string, value: string) => {
      if (!selected) return;
      const originalValue = selected.styles[property];

      iframeRef.current?.contentWindow?.postMessage(
        { type: "apply-style", property, value },
        "*",
      );

      setChanges((prev) => {
        const idx = prev.findIndex(
          (c) => c.selector === selected.selector && c.property === property,
        );
        const change: StyleChange = {
          selector: selected.selector,
          path: selected.path,
          text: selected.text,
          property,
          from: originalValue,
          to: value,
        };
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...change, from: prev[idx].from };
          if (updated[idx].from === value) updated.splice(idx, 1);
          return updated;
        }
        if (originalValue === value) return prev;
        return [...prev, change];
      });
    },
    [selected],
  );

  const handleInputCommit = (key: string) => {
    const val = editValues[key];
    if (val !== undefined) applyStyle(key, val);
  };

  const handleSave = async () => {
    if (changes.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/visual-editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedAt: new Date().toISOString(),
          viewport,
          changes,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("저장 실패");
    }
    setSaving(false);
  };

  const selectParent = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "select-parent" },
      "*",
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d1117] flex flex-col">
      {/* 툴바 */}
      <header className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-[13px] text-[#8b949e] hover:text-white transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          관리자로 돌아가기
        </Link>

        <div className="flex items-center gap-1 bg-[#0d1117] rounded-lg p-0.5">
          <button
            onClick={() => setViewport("mobile")}
            className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${viewport === "mobile" ? "bg-[#30363d] text-white" : "text-[#8b949e] hover:text-white"}`}
          >
            Mobile
          </button>
          <button
            onClick={() => setViewport("desktop")}
            className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${viewport === "desktop" ? "bg-[#30363d] text-white" : "text-[#8b949e] hover:text-white"}`}
          >
            Desktop
          </button>
        </div>

        <div className="flex items-center gap-3">
          {changes.length > 0 && (
            <button
              onClick={() => setChanges([])}
              className="text-[12px] text-[#8b949e] hover:text-red-400 transition-colors"
            >
              초기화
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || changes.length === 0}
            className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {saving
              ? "저장 중..."
              : saved
                ? "저장 완료!"
                : `저장 (${changes.length})`}
          </button>
        </div>
      </header>

      {/* 메인 영역 */}
      <div className="flex-1 flex min-h-0">
        {/* 캔버스 */}
        <div className="flex-1 flex justify-center bg-[#0d1117] overflow-hidden p-4">
          <iframe
            ref={iframeRef}
            src="/"
            className="bg-white rounded-lg shadow-2xl border border-[#30363d]"
            style={{
              width: viewport === "mobile" ? 420 : 1200,
              height: "100%",
              maxWidth: "100%",
            }}
          />
        </div>

        {/* 속성 패널 */}
        <aside className="w-[320px] bg-[#161b22] border-l border-[#30363d] flex flex-col shrink-0">
          {/* 탭 */}
          <div className="flex border-b border-[#30363d] shrink-0">
            <button
              onClick={() => setTab("props")}
              className={`flex-1 py-2.5 text-[12px] font-medium transition-colors ${tab === "props" ? "text-white border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-white"}`}
            >
              속성
            </button>
            <button
              onClick={() => setTab("changes")}
              className={`flex-1 py-2.5 text-[12px] font-medium transition-colors relative ${tab === "changes" ? "text-white border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-white"}`}
            >
              변경사항
              {changes.length > 0 && (
                <span className="ml-1.5 bg-[#da3633] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {changes.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === "props" ? (
              selected ? (
                <div>
                  {/* 선택된 요소 정보 */}
                  <div className="px-4 py-3 border-b border-[#30363d]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-mono text-[#58a6ff]">
                        &lt;{selected.tagName}&gt;
                      </span>
                      <button
                        onClick={selectParent}
                        className="text-[11px] text-[#8b949e] hover:text-white border border-[#30363d] rounded px-2 py-0.5 transition-colors"
                      >
                        부모 선택 ↑
                      </button>
                    </div>
                    <p className="text-[11px] text-[#8b949e] font-mono truncate">
                      {selected.path}
                    </p>
                    {selected.text && (
                      <p className="text-[11px] text-[#6e7681] mt-1 truncate">
                        &quot;{selected.text}&quot;
                      </p>
                    )}
                  </div>

                  {/* 스타일 그룹 */}
                  {STYLE_GROUPS.map((group) => (
                    <div
                      key={group.label}
                      className="border-b border-[#30363d]"
                    >
                      <div className="px-4 py-2 bg-[#0d1117]/50">
                        <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
                          {group.label}
                        </span>
                      </div>
                      <div className="px-4 py-2 space-y-2">
                        {group.props.map((prop) => {
                          const value = selected.styles[prop.key] || "";
                          const isColor = COLOR_PROPS.has(prop.key);
                          const displayValue = editValues[prop.key] ?? value;

                          return (
                            <div
                              key={prop.key}
                              className="flex items-center gap-2"
                            >
                              <label className="text-[11px] text-[#8b949e] w-[60px] shrink-0">
                                {prop.label}
                              </label>
                              {isColor ? (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <input
                                    type="color"
                                    value={cssToHex(displayValue)}
                                    onChange={(e) => {
                                      setEditValues((p) => ({
                                        ...p,
                                        [prop.key]: e.target.value,
                                      }));
                                      applyStyle(prop.key, e.target.value);
                                    }}
                                    className="w-7 h-7 rounded cursor-pointer border border-[#30363d] p-0 bg-transparent"
                                  />
                                  <input
                                    type="text"
                                    value={displayValue}
                                    onChange={(e) =>
                                      setEditValues((p) => ({
                                        ...p,
                                        [prop.key]: e.target.value,
                                      }))
                                    }
                                    onBlur={() => handleInputCommit(prop.key)}
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      handleInputCommit(prop.key)
                                    }
                                    className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#c9d1d9] font-mono outline-none focus:border-[#58a6ff] transition-colors"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={displayValue}
                                  onChange={(e) =>
                                    setEditValues((p) => ({
                                      ...p,
                                      [prop.key]: e.target.value,
                                    }))
                                  }
                                  onBlur={() => handleInputCommit(prop.key)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleInputCommit(prop.key)
                                  }
                                  className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#c9d1d9] font-mono outline-none focus:border-[#58a6ff] transition-colors"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-12 h-12 rounded-full bg-[#0d1117] flex items-center justify-center mb-4">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8b949e"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3C6.75 3 2 12 2 12s4.75 9 10 9 10-9 10-9-4.75-9-10-9Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-[#8b949e]">
                    페이지에서 요소를 클릭하면
                    <br />
                    여기에 속성이 표시됩니다
                  </p>
                </div>
              )
            ) : (
              <div className="p-4">
                {changes.length === 0 ? (
                  <p className="text-[13px] text-[#8b949e] text-center py-8">
                    아직 변경사항이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {changes.map((c, i) => (
                      <div
                        key={i}
                        className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] text-[#58a6ff] font-mono truncate">
                              {c.path}
                            </p>
                            {c.text && (
                              <p className="text-[10px] text-[#6e7681] truncate mt-0.5">
                                &quot;{c.text}&quot;
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              applyStyle(c.property, c.from);
                              setChanges((prev) =>
                                prev.filter((_, j) => j !== i),
                              );
                            }}
                            className="text-[10px] text-[#8b949e] hover:text-red-400 shrink-0"
                          >
                            되돌리기
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-[#8b949e]">{c.property}</span>
                          <span className="text-[#f85149] line-through">
                            {c.from}
                          </span>
                          <span className="text-[#8b949e]">→</span>
                          <span className="text-[#3fb950]">{c.to}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
