export const changelog = {
  heading: {
    label: "02 / CHANGELOG",
    title: "CHANGELOG",
    subtitle: "更新履歴",
    lead: "スタジオの変更は、すべてログに残します。",
  },
  kindLabels: { added: "ADDED", changed: "CHANGED", fixed: "FIXED" },
  entries: [
    {
      date: "2026-10-01",
      kind: "added",
      text: "レンダー監視ツールframewatchに、失敗フレームの自動再投入を追加",
    },
    {
      date: "2026-09-12",
      kind: "changed",
      text: "HDAライブラリの配布を、週次から差分配信に変更",
    },
    {
      date: "2026-08-28",
      kind: "fixed",
      text: "シミュレーション分割で、境界のパーティクルが重複する問題を修正",
    },
    {
      date: "2026-07-03",
      kind: "added",
      text: "納品チェックリストの自動生成（shipnote）を社内公開",
    },
  ],
};
