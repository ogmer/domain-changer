chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "performReplace") {
    const { from, to, mode } = msg;
    performReplace(from, to, mode)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep channel open
  }
  // exportDiff removed to avoid downloads permission
});

async function performReplace(from, to, mode = "exact") {
  const nodes = await new Promise((resolve) =>
    chrome.bookmarks.getTree(resolve)
  );
  const list = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.url) list.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);

  const matchFn = buildMatcher(from, mode);

  // まず対象を洗い出す
  const targets = [];
  for (const b of list) {
    try {
      const url = new URL(b.url);
      if (matchFn(url.hostname)) {
        targets.push({ b, newUrl: b.url.replace(url.hostname, to) });
      }
    } catch (e) {
      // ignore
    }
  }

  // 1件ずつ直列に await すると件数が多いとき非常に遅いため、チャンク単位で並列更新する
  const diffs = [];
  const CHUNK_SIZE = 50;
  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async ({ b, newUrl }) => {
        try {
          await new Promise((resolve, reject) =>
            chrome.bookmarks.update(b.id, { url: newUrl }, () => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve();
            })
          );
          diffs.push({ id: b.id, title: b.title, oldUrl: b.url, newUrl });
        } catch (e) {
          // ignore
        }
      })
    );
  }

  return diffs;
}

function buildMatcher(from, mode) {
  if (!from) return () => false;
  if (mode === "regexp") {
    const re = new RegExp(from);
    return (host) => re.test(host);
  }
  if (mode === "wildcard") {
    // support '*' at start or end
    if (from.startsWith("*") && from.endsWith("*")) {
      const mid = from.slice(1, -1);
      return (host) => host.includes(mid);
    }
    if (from.startsWith("*")) {
      const tail = from.slice(1);
      return (host) => host.endsWith(tail);
    }
    if (from.endsWith("*")) {
      const head = from.slice(0, -1);
      return (host) => host.startsWith(head);
    }
    return (host) => host === from;
  }
  // exact
  return (host) => host === from;
}

