export interface Translations {
  title: string;
  description: string;
  fromDomainPlaceholder: string;
  toDomainPlaceholder: string;
  loadBookmarks: string;
  updatePreview: string;
  applyReplace: string;
  previewTitle: string;
  showOnlyChanged: string;
  notLoaded: string;
  bookmarkLoadError: string;
  domainRequired: string;
  confirmReplace: string;
  replaceComplete: string;
  replaceError: string;
  changeCount: string;
  exact: string;
  wildcard: string;
  regexp: string;
}

export const translations: Record<string, Translations> = {
  ja: {
    title: "ドメイン置換くん",
    description:
      "ブックマークを読み込み、指定したドメインを任意のドメインに変更します。",
    fromDomainPlaceholder: "置換元ドメイン（例: example.com）",
    toDomainPlaceholder: "置換先ドメイン（例: example.net）",
    loadBookmarks: "ブックマーク読み込み",
    updatePreview: "プレビュー更新",
    applyReplace: "置換実行",
    previewTitle: "プレビュー（置換後のURL）",
    showOnlyChanged: "置換対象のみ表示",
    notLoaded: "読み込まれていません",
    bookmarkLoadError: "ブックマークの読み込みに失敗しました。",
    domainRequired: "置換元と置換先のドメインを入力してください。",
    confirmReplace: "実際にブックマークを更新します。よろしいですか？",
    replaceComplete: "置換が完了しました。",
    replaceError: "置換中にエラーが発生しました。",
    changeCount: "変更件数",
    exact: "exact",
    wildcard: "wildcard (*)",
    regexp: "regexp",
  },
  en: {
    title: "Domain Replacer",
    description: "Load bookmarks and change specified domains to any domain.",
    fromDomainPlaceholder: "From domain (e.g., example.com)",
    toDomainPlaceholder: "To domain (e.g., example.net)",
    loadBookmarks: "Load Bookmarks",
    updatePreview: "Update Preview",
    applyReplace: "Apply Replace",
    previewTitle: "Preview (URLs after replacement)",
    showOnlyChanged: "Show only changed items",
    notLoaded: "Not loaded",
    bookmarkLoadError: "Failed to load bookmarks.",
    domainRequired: "Please enter both from and to domains.",
    confirmReplace: "Are you sure you want to update the bookmarks?",
    replaceComplete: "Replacement completed.",
    replaceError: "An error occurred during replacement.",
    changeCount: "Changes",
    exact: "exact",
    wildcard: "wildcard (*)",
    regexp: "regexp",
  },
};
