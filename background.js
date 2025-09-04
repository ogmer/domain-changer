/* background.js
   - receives messages from popup to perform replacement in background
   - supports wildcard (simple '*' prefix/suffix) and regexp modes
   - returns diffs and can trigger JSON download of diffs
*/

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

  const diffs = [];
  const matchFn = buildMatcher(from, mode);

  for (const b of list) {
    try {
      const url = new URL(b.url);
      if (matchFn(url.hostname)) {
        const newUrl = b.url.replace(url.hostname, to);
        await new Promise((resolve) =>
          chrome.bookmarks.update(b.id, { url: newUrl }, resolve)
        );
        diffs.push({ id: b.id, title: b.title, oldUrl: b.url, newUrl });
      }
    } catch (e) {
      // ignore
    }
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
