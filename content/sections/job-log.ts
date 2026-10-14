export const jobLog = {
  heading: {
    label: "04 / JOB LOG",
    title: "JOB LOG",
    subtitle: "実績",
    lead: "完了したジョブの実行記録です。案件名と数値は架空です。",
  },
  columns: {
    id: "ID",
    title: "JOB",
    status: "STATUS",
    hours: "HOURS",
    result: "RESULT",
  },
  statusLabels: { done: "DONE", running: "RUNNING" },
  toggleLabels: { open: "詳細を開く", close: "詳細を閉じる" },
  toolsLabel: "TOOLS",
  jobs: [
    {
      id: "JOB-0412",
      title: "群衆エフェクト",
      client: "架空の映画制作会社",
      status: "done",
      hours: 312,
      tools: ["Houdini", "simqueue", "framewatch"],
      result: "再レンダー時間を41%短縮",
      detail:
        "群衆の破片シミュレーションを 8分割し、失敗フレームだけの再投入で、全体のやり直しをなくしました。",
    },
    {
      id: "JOB-0398",
      title: "破壊表現",
      client: "架空のゲーム会社",
      status: "done",
      hours: 186,
      tools: ["Houdini", "nodeshelf"],
      result: "HDAの再利用率 72%",
      detail:
        "破壊表現をHDAにまとめ、ショットごとに版を固定して、修正の影響範囲を限定しました。",
    },
    {
      id: "JOB-0371",
      title: "流体シミュレーション",
      client: "架空の広告代理店",
      status: "done",
      hours: 94,
      tools: ["Houdini", "simqueue", "shipnote"],
      result: "納品の差し戻し 0 件",
      detail:
        "納品仕様のチェックリストを自動生成し、書き出しの確認漏れをなくしました。",
    },
    {
      id: "JOB-0420",
      title: "社内パイプラインのUSD移行",
      client: "自社",
      status: "running",
      hours: 58,
      tools: ["Python", "OpenUSD", "logcast"],
      result: "移行率 35%",
      detail:
        "既存の素材をUSDへ段階的に移しています。命名規則の検証を取り込み時に行います。",
    },
  ],
};
