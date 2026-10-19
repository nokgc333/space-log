export const pipeline = {
  heading: {
    label: "03 / PIPELINE",
    title: "FROM NODE \nTO SHOT",
    subtitle: "ノードから、ショットへ。",
    lead: "取り込みから納品（SHOT）まで、\n5つの工程を「ツール（NODE）」でつなぎます。",
  },
  replayLabel: "実行ログ",
  stages: [
    {
      id: "ingest",
      stage: "INGEST",
      tool: "pipeinit",
      role: "フォルダの生成と、命名規則の検査",
      detail:
        "プロジェクトのフォルダを規則どおりに作り、ファイル名が命名規則（YAML）に合うかを検査します。違反は一覧にして、終了コード 1 で知らせます。",
      terminal: [
        "$ pipeinit validate ./shots",
        "SHOT040_fx_v3.hip: does not match ショットファイル命名規則",
        "$ echo $?",
        "1",
      ],
    },
    {
      id: "build",
      stage: "BUILD",
      tool: "scene-doctor",
      role: "シーンの欠陥の検出",
      detail:
        "Houdiniのシーンを書き出す前に、非多様体・N-gon・ゼロ面積、未接続のノード、命名違反を検査します。結果は CSV と JSON で出力します。",
      terminal: [
        "$ hython scene_doctor_cli.py --hip SH040.hip --format both",
        "checking geometry, nodes and names",
        "  ✗ non-manifold edges: 2",
        "  ✗ unconnected nodes: 1",
        "report written (csv, json)",
      ],
    },
    {
      id: "simulate",
      stage: "SIMULATE",
      tool: "frame-slicer",
      role: "フレーム範囲の分割と、キューへの投入",
      detail:
        "キャッシュの書き出しなど、フレーム同士が独立した処理を、フレーム範囲で指定した数に分けます。QueueWatchへ、そのまま投入することもできます。",
      terminal: [
        "$ frame-slicer split 1001-1240 --slices 8",
        "slice 1/8  1001-1030  (30 frames)",
        "slice 2/8  1031-1060  (30 frames)",
        "  ...",
        "slice 8/8  1211-1240  (30 frames)",
      ],
    },
    {
      id: "render",
      stage: "RENDER",
      tool: "queuewatch",
      role: "ジョブキューと、失敗時の自動再投入",
      detail:
        "レンダージョブを優先度つきのキューに積み、失敗したものは間隔を倍々に空けて自動で再投入します。回数を超えたジョブはデッドレターキューへ移します。実際のレンダーは行わない、疑似レンダーファームです。",
      terminal: [
        "$ python houdini_submit_job.py --name SH120_render --priority high",
        "Success: job 'SH120_render' submitted (id=1, status=pending)",
        "retry: Retry in 1s: Simulated render failure (license server timeout)",
        "retry: Retry in 2s: Simulated render failure (license server timeout)",
        "job 1 exceeded max_retries, moved to dead",
      ],
    },
    {
      id: "deliver",
      stage: "DELIVER",
      tool: "unibridge",
      role: "DCC間の受け渡しの整合検査",
      detail:
        "HoudiniとBlenderの間で受け渡すUSDを検査し、座標系（up軸）・スケール単位・命名の食い違いを見つけます。検出とレポート（HTML・CSV・JSON）に徹し、自動修正はしません。",
      terminal: [
        "$ python cli.py scale-check --source houdini.usda --target blender.usda",
        "[error] scale_mismatch: metersPerUnit mismatch: source=1.0, target=0.01 (100x)",
        "$ echo $?",
        "1",
      ],
    },
  ],
};
