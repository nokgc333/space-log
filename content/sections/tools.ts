export const tools = {
  heading: {
    label: "04 / TOOLS",
    title: "TOOLS",
    subtitle: "制作ツール",
    lead: "これまでに制作したツールを公開しています。",
  },
  columns: { repo: "GITHUB", tool: "TOOLS", tags: "TAGS", summary: "SUMMARY" },
  toggleLabels: { open: "詳細を開く", close: "詳細を閉じる" },
  repoLinkLabel: "{name}のGitHubリポジトリ（新しいタブで開く）",
  pager: { prev: "前のツール", next: "次のツール" },
  entries: [
    {
      id: "pipeinit",
      name: "pipeinit",
      repoUrl: "https://github.com/nokgc333/pipeinit",
      tags: ["Python", "Click", "YAML"],
      summary: "フォルダの生成と、命名規則の検査、版番号の採番。",
      detail:
        "フォルダ構成と命名規則を、YAMLの規則ファイルで決めます。違反は一覧にして、終了コードで知らせます。版番号は、実行前に確認してから採番します。",
    },
    {
      id: "scene-doctor",
      name: "scene-doctor",
      repoUrl: "https://github.com/nokgc333/scene-doctor",
      tags: ["Python", "Houdini", "PySide6"],
      summary: "Houdiniシーンの欠陥（形状・ノード・命名）の検出。",
      detail:
        "Houdiniに依存しない検査の核と、hythonから使う部分を分けています。結果はCSVとJSONで出力します。Houdini内で使うパネルも用意しています。",
    },
    {
      id: "frame-slicer",
      name: "frame-slicer",
      repoUrl: "https://github.com/nokgc333/frame-slicer",
      tags: ["Python", "CLI"],
      summary: "フレーム範囲の分割と、キューへの投入。",
      detail:
        "キャッシュの書き出しなど、フレーム同士が独立した処理を、指定した数に等分します。シミュレーション本体は、前のフレームに依存するため、分けません。分けたものは、QueueWatchへそのまま投入できます。",
    },
    {
      id: "queuewatch",
      name: "queuewatch",
      repoUrl: "https://github.com/nokgc333/queuewatch",
      tags: ["Python", "Celery", "Redis", "FastAPI", "React"],
      summary: "レンダージョブのキューと、失敗時の自動再投入。",
      detail:
        "優先度つきのキュー、間隔を倍々に空ける再投入、上限を超えたジョブの退避、状態を見る画面を備えます。実際のレンダーは行わない、疑似レンダーファームです。",
    },
    {
      id: "unibridge",
      name: "unibridge",
      repoUrl: "https://github.com/nokgc333/unibridge",
      tags: ["Python", "OpenUSD", "FastAPI"],
      summary: "HoudiniとBlenderの間で渡すUSDの整合検査。",
      detail:
        "座標系（up軸）・スケール単位・命名の食い違いを見つけて、CSV・JSON・HTMLのレポートに出します。変換は、指定したときだけ行います。",
    },
    {
      id: "pipeboard",
      name: "pipeboard",
      repoUrl: "https://github.com/nokgc333/pipeboard",
      tags: ["Python", "FastAPI", "Next.js", "PySide6"],
      summary: "ショットの進捗をカンバンで管理する、小さなトラッカー。",
      detail:
        "WebとデスクトップのPySide6、2つの画面から、同じAPIを使います。Houdiniから、ステータスを更新する導線も用意しました。",
    },
  ],
};
