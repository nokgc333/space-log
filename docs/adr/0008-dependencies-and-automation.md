# ADR-0008: 依存更新と自動化

## 状態

採用。

## 決定

- Dependabot が npm と GitHub Actions を週次で確認します。
- minor と patch の更新をまとめ、小さい PR で取り込みます。
- TypeScript 6.1 以降は typescript-eslint の対応まで保留します。
- Node.js 24 に合わせ、Node 型の major 更新を保留します。
- ESLint 10 を使用します。
- main の必須チェックは `Lint, typecheck, format, unit test, build` です。
- 管理者を保護の対象外とし、force push と削除を禁止します。
