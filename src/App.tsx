import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLanguage } from "./i18n/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";

type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

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

// React.memo でリスト部分を分離し、入力欄のキーストロークごとの全件再レンダーを防ぐ
const BookmarkList = React.memo(({ items }: { items: BookmarkNode[] }) => (
  <ul className="list-decimal pl-5">
    {items.map((b) => (
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
));

const fetchBookmarks = async (): Promise<BookmarkNode[]> => {
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
  return list;
};

const App: React.FC = () => {
  const { t } = useLanguage();
  const [fromDomain, setFromDomain] = useState("");
  const [toDomain, setToDomain] = useState("");
  const [preview, setPreview] = useState<BookmarkNode[]>([]);
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [mode, setMode] = useState<"exact" | "wildcard" | "regexp">("exact");

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: fetchBookmarks,
    enabled: false, // ボタン押下時のみ読み込む（従来挙動を維持）
  });
  const bookmarks = bookmarksQuery.data ?? [];

  const loadBookmarks = async () => {
    const { data, error } = await bookmarksQuery.refetch();
    if (error) {
      console.error(error);
      alert(t.bookmarkLoadError);
      return;
    }
    setPreview(data ?? []);
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

  const replaceMutation = useMutation({
    mutationFn: async () => {
      const from = fromDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const to = toDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const response = await new Promise<any>((resolve) =>
        chrome.runtime.sendMessage(
          { type: "performReplace", from, to, mode },
          resolve
        )
      );
      if (!response?.ok) throw new Error(response?.error || "unknown");
      return (response.result || []) as unknown[];
    },
    onSuccess: async (diffs) => {
      alert(`${t.replaceComplete} ${t.changeCount}: ${diffs.length}`);
      // refetch で最新のブックマークを取得し直す
      await loadBookmarks();
    },
    onError: (e) => {
      console.error(e);
      alert(t.replaceError);
    },
  });

  const loading = bookmarksQuery.isFetching || replaceMutation.isPending;

  const applyReplace = () => {
    if (!fromDomain || !toDomain) {
      alert(t.domainRequired);
      return;
    }
    if (!confirm(t.confirmReplace)) return;
    replaceMutation.mutate();
  };

  // exportDiffs removed: feature disabled to limit permissions

  // id -> 元URL のマップ（O(n²) だった find の置き換え）
  const originalUrlById = useMemo(
    () => new Map(bookmarks.map((b) => [b.id, b.url || ""])),
    [bookmarks]
  );

  // displayedPreview: when `onlyChanged` is true, show only items whose preview URL differs from the original loaded bookmarks
  // useMemo で参照を安定させ、入力欄のキーストロークごとの再計算・リスト再レンダーを防ぐ
  const displayedPreview = useMemo(() => {
    if (!onlyChanged) return preview;
    return preview.filter((b) => {
      const orig = originalUrlById.get(b.id);
      // if original not found, keep it (safe fallback)
      if (orig === undefined) return true;
      return orig !== (b.url || "");
    });
  }, [preview, onlyChanged, originalUrlById]);

  return (
    <div className="w-[520px] h-[560px] p-4 bg-white text-sm overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold">{t.title}</h1>
        <LanguageSwitcher />
      </div>

      <div className="flex gap-2 mb-3 text-xs">
        <input
          value={fromDomain}
          onChange={(e) => setFromDomain(e.target.value)}
          placeholder={t.fromDomainPlaceholder}
          className="flex-1 px-2 py-1 border rounded"
        />
        <input
          value={toDomain}
          onChange={(e) => setToDomain(e.target.value)}
          placeholder={t.toDomainPlaceholder}
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={loadBookmarks}
          className="flex-1 min-w-[160px] px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading}
        >
          {t.loadBookmarks}
        </button>
        <button
          onClick={buildPreview}
          className="flex-1 min-w-[140px] px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          {t.updatePreview}
        </button>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="min-w-[120px] px-2 py-2 border rounded"
        >
          <option value="exact">{t.exact}</option>
          <option value="wildcard">{t.wildcard}</option>
          <option value="regexp">{t.regexp}</option>
        </select>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={applyReplace}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {t.applyReplace}
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-700">{t.previewTitle}</div>
        <label className="text-sm flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={onlyChanged}
            onChange={(e) => setOnlyChanged(e.target.checked)}
          />
          <span>{t.showOnlyChanged}</span>
        </label>
      </div>
      <div className="border border-gray-200 p-3 rounded h-[320px] overflow-auto bg-gray-50">
        {preview.length === 0 ? (
          <div className="text-gray-500">{t.notLoaded}</div>
        ) : (
          <BookmarkList items={displayedPreview} />
        )}
      </div>
    </div>
  );
};

export default App;
