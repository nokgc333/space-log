export const pipeline = {
  heading: {
    label: "03 / PIPELINE",
    title: "FROM NODE TO SHOT",
    subtitle: "ノードから、ショットへ。",
    lead: "取り込みから納品まで、5つの工程を自社ツールでつなぎます。",
  },
  replayLabel: "実行ログ",
  stages: [
    {
      id: "ingest",
      stage: "INGEST",
      tool: "logcast",
      role: "素材の取り込みと命名規則の検証",
      detail:
        "受け取った素材を規則に照らして検査し、違反があれば取り込みを止めて理由を返します。",
      terminal: [
        "$ logcast ingest ./incoming --rules studio.yaml",
        "scanning 1,284 files",
        "  ✓ 1,281 match naming rules",
        "  ✗ 3 rejected: SH040_fx_v3.abc (missing padding)",
        "done in 4.2s",
      ],
    },
    {
      id: "build",
      stage: "BUILD",
      tool: "nodeshelf",
      role: "HDAライブラリの版管理と配布",
      detail:
        "HDAの版を一元管理し、ショットごとに使う版を固定します。差分だけを各端末へ配ります。",
      terminal: [
        "$ nodeshelf publish fx::debris_scatter --bump minor",
        "fx::debris_scatter 2.3.0 -> 2.4.0",
        "pinned in 12 shots, diff 184 KB",
        "published",
      ],
    },
    {
      id: "simulate",
      stage: "SIMULATE",
      tool: "simqueue",
      role: "シミュレーションの分割と投入",
      detail:
        "重いシミュレーションを空間で分割し、空いている計算機へ順に投入します。",
      terminal: [
        "$ simqueue submit SH120_pyro --slices 8",
        "8 slices queued on 8 nodes",
        "  slice 1/8 ........ done 00:41:12",
        "  slice 8/8 ........ done 00:39:58",
        "merged cache: 412 GB",
      ],
    },
    {
      id: "render",
      stage: "RENDER",
      tool: "framewatch",
      role: "レンダーの監視と失敗時の再投入",
      detail:
        "失敗したフレームだけを見つけて、原因ごとに再投入します。全体のやり直しをなくします。",
      terminal: [
        "$ framewatch watch SH120 --retry 2",
        "frames 1001-1240: 240 total",
        "  ✗ 1187 out of memory -> retry on 128 GB node",
        "  ✓ 1187 done (retry 1)",
        "240/240 complete",
      ],
    },
    {
      id: "deliver",
      stage: "DELIVER",
      tool: "shipnote",
      role: "納品物の梱包とチェックリスト生成",
      detail: "納品先の仕様に合わせて書き出し、確認項目を一覧にして添えます。",
      terminal: [
        "$ shipnote pack SH120 --spec client-a",
        "exr 16-bit half, ACEScg, 1001-1240",
        "checklist: 14 items, 14 passed",
        "package ready: SH120_v012.zip",
      ],
    },
  ],
};
