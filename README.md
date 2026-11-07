# Application shell

Next.js と React による Web アプリケーションの雛形です。

## 開発

- Node.js 24 と npm 11.19.0 以降を使用します。
- `npm ci` で依存をインストールします。
- `npm run dev` で開発サーバーを起動します。
- `npm run build` で本番ビルドを作成します。
- `npm start` で本番サーバーを起動します。

## ライセンス

MIT。詳細は [LICENSE](LICENSE) を参照してください。

## 確認

- `npm run lint` で静的解析を実行します。
- `npm run typecheck` でルート型生成と型検査を実行します。
- `npm run format:check` で整形を検査します。
- 開発サーバーの `/` で空の main が描画されることを確認します。
- 本番ビルド後に `npm start` を実行し、`/` が表示されることを確認します。

## 本番レスポンスの確認

- `npm run build` と `npm start` を実行します。
- `curl -I http://localhost:3000/` と `curl -I http://localhost:3000/privacy` で CSP、Referrer-Policy、X-Content-Type-Options などのヘッダーを確認します。
- ブラウザーの開発者ツールで `/_next/static/` の JavaScript を開き、末尾の sourceMappingURL に対応する `.map` が取得できることを確認します。
