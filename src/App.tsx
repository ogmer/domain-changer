import React, { useEffect, useState } from "react";

type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDomain, setFromDomain] = useState("");
  const [toDomain, setToDomain] = useState("");
  const [preview, setPreview] = useState<BookmarkNode[]>([]);
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [mode, setMode] = useState<"exact" | "wildcard" | "regexp">("exact");

  useEffect(() => {
    // no-op
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const nodes = await new Promise<BookmarkNode[]>((resolve) =>
        chrome.bookmarks.getTree((tree) => resolve(tree))
      );
      const list: BookmarkNode[] = [];
      const walk = (nodes: BookmarkNode[]) => {
        for (const n of nodes) {
          if (n.url) list.push(n);
          if (n.children) walk(n.children as BookmarkNode[]);
        }
      };
      walk(nodes);
      setBookmarks(list);
      setPreview(list);
    } catch (e) {
      console.error(e);
      alert("ブックマークの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const buildPreview = () => {
    if (!fromDomain) return setPreview(bookmarks);
    try {
      const from = fromDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const to = toDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const p = bookmarks.map((b) => {
        if (!b.url) return b;
        try {
          const url = new URL(b.url);
          if (url.hostname === from) {
            const newUrl = b.url.replace(url.hostname, to);
            return { ...b, url: newUrl } as BookmarkNode;
          }
        } catch (_) {
          return b;
        }
        return b;
      });
      setPreview(p);
    } catch (e) {
      console.error(e);
    }
  };

  const applyReplace = async () => {
    if (!fromDomain || !toDomain) {
      alert("置換元と置換先のドメインを入力してください。");
      return;
    }
    if (!confirm("実際にブックマークを更新します。よろしいですか？")) return;
    setLoading(true);
    try {
      const from = fromDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const to = toDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const response = await new Promise<any>((resolve) =>
        chrome.runtime.sendMessage(
          { type: "performReplace", from, to, mode },
          resolve
        )
      );
      if (!response?.ok) throw new Error(response?.error || "unknown");
      const diffs = response.result || [];
      alert(`置換が完了しました。変更件数: ${diffs.length}`);
      await loadBookmarks();
    } catch (e) {
      console.error(e);
      alert("置換中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // exportDiffs removed: feature disabled to limit permissions

  const formatPreviewUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      let s =
        parsed.hostname +
        (parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "");
      if (parsed.search) s += parsed.search;
      s = s.replace(/\/$/, "");
      if (s.length > 50) return s.slice(0, 47) + "...";
      return s;
    } catch (_) {
      return u.length > 50 ? u.slice(0, 47) + "..." : u;
    }
  };

  // displayedPreview: when `onlyChanged` is true, show only items whose preview URL differs from the original loaded bookmarks
  const displayedPreview = preview.filter((b) => {
    if (!onlyChanged) return true;
    const orig = bookmarks.find((x) => x.id === b.id);
    // if original not found, keep it (safe fallback)
    if (!orig) return true;
    return (orig.url || "") !== (b.url || "");
  });

  return (
    <div className="w-[520px] h-[560px] p-4 bg-white text-sm overflow-auto">
      <h1 className="text-xl font-bold mb-3">ドメイン置換くん</h1>

      <div className="flex gap-2 mb-3 text-xs">
        <input
          value={fromDomain}
          onChange={(e) => setFromDomain(e.target.value)}
          placeholder="置換元ドメイン（例: example.com）"
          className="flex-1 px-2 py-1 border rounded"
        />
        <input
          value={toDomain}
          onChange={(e) => setToDomain(e.target.value)}
          placeholder="置換先ドメイン（例: example.net）"
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={loadBookmarks}
          className="flex-1 min-w-[160px] px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading}
        >
          ブックマーク読み込み
        </button>
        <button
          onClick={buildPreview}
          className="flex-1 min-w-[140px] px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          プレビュー更新
        </button>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="min-w-[120px] px-2 py-2 border rounded"
        >
          <option value="exact">exact</option>
          <option value="wildcard">wildcard (*)</option>
          <option value="regexp">regexp</option>
        </select>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={applyReplace}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          置換実行
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-700">プレビュー（置換後のURL）</div>
        <label className="text-sm flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={onlyChanged}
            onChange={(e) => setOnlyChanged(e.target.checked)}
          />
          <span>置換対象のみ表示</span>
        </label>
      </div>
      <div className="border border-gray-200 p-3 rounded h-[320px] overflow-auto bg-gray-50">
        {preview.length === 0 ? (
          <div className="text-gray-500">読み込まれていません</div>
        ) : (
          <ul className="list-decimal pl-5">
            {displayedPreview.map((b) => (
              <li
                key={b.id}
                className="mb-2 leading-tight py-1 px-2 rounded hover:bg-gray-100"
              >
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 block hover:underline"
                  title={b.url}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-800">
                      {b.title || formatPreviewUrl(b.url!)}
                    </span>
                    {b.title && (
                      <span className="text-xs text-gray-500">
                        {formatPreviewUrl(b.url!)}
                      </span>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
