import fs from "node:fs";
import path from "node:path";

import { parse } from "yaml";

import { newsEntrySchema } from "@/lib/content/schema";
import type { NewsEntry } from "@/lib/content/schema";

import { sortNewestFirst } from "./sort-entries";

const NEWS_DIR = path.join(process.cwd(), "content", "news");
const ENTRY_FILE = /^(\d{4}-\d{2}-\d{2})-[a-z0-9-]+\.md$/;
const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function readEntry(dir: string, file: string): NewsEntry {
  const match = ENTRY_FILE.exec(file);
  if (!match) throw new Error(`${file}: name it like 2026-10-01-some-words.md`);

  const frontmatter = FRONTMATTER.exec(
    fs.readFileSync(path.join(dir, file), "utf8"),
  );
  if (!frontmatter) throw new Error(`${file}: no frontmatter (--- … ---)`);

  let data: unknown;
  try {
    data = parse(frontmatter[1]);
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`);
  }

  const result = newsEntrySchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`${file}: ${issue.path.join(".")}: ${issue.message}`);
  }
  if (result.data.date !== match[1])
    throw new Error(
      `${file}: the date in the name (${match[1]}) differs from date (${result.data.date})`,
    );

  return { id: file.replace(/\.md$/, ""), ...result.data };
}

export function loadNewsEntries(dir: string = NEWS_DIR): NewsEntry[] {
  if (!fs.existsSync(dir)) throw new Error(`news folder not found: ${dir}`);

  const entries = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => readEntry(dir, file));
  return sortNewestFirst(entries);
}
