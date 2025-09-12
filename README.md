# ドメイン置換くん

ブックマークの指定ドメインを別のドメインに一括で置換するシンプルな Chrome 拡張機能です。React + TypeScript + TailwindCSS + Vite を使用しています。

## 機能

- TypeScript による型安全性
- TailwindCSS によるスタイリング
- Vite による高速な開発環境
- React によるモダンな UI 開発

## Chrome 拡張機能としての読み込み方法

1. Chrome ブラウザで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. プロジェクトの `dist` ディレクトリを選択

## 使い方（ドメイン置換）

1. 拡張を読み込んで拡張のポップアップを開く（ツールバーのアイコンをクリック）
2. 「置換元ドメイン」に現在のドメイン（例: example.com）を入力
3. 「置換先ドメイン」に置換したいドメイン（例: example.net）を入力
4. 「ブックマーク読み込み」をクリックして現在の全ブックマークを読み込む
5. 「プレビュー更新」で置換後の URL のプレビューを確認
6. 問題なければ「置換実行」をクリックして実際にブックマークを更新

注意: 操作は元に戻せません。必要なら事前にブックマークのバックアップを取ってください。

## プロジェクト構造

```
chrome-extension-template/
├── manifest.json          # Chrome拡張機能の設定ファイル
├── package.json          # プロジェクトの依存関係管理
├── tsconfig.json         # TypeScriptの設定
├── vite.config.ts        # Viteの設定
├── tailwind.config.js    # TailwindCSSの設定
├── postcss.config.js     # PostCSSの設定
├── index.html           # メインのHTMLファイル
└── src/                 # ソースコード
    ├── main.tsx         # アプリケーションのエントリーポイント
    ├── App.tsx          # メインのAppコンポーネント
    └── index.css        # グローバルスタイル
```

