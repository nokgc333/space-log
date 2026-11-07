import { listNewsFiles, NEWS_DIR, readNewsEntry } from "./load-news-entries";

export type NewsProblem = { file: string; message: string };
export type NewsCheck = { count: number; problems: NewsProblem[] };

function messageOf(error: unknown, file: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith(`${file}: `)
    ? message.slice(file.length + 2)
    : message;
}

export function checkNewsEntries(dir: string = NEWS_DIR): NewsCheck {
  let files: string[];
  try {
    files = listNewsFiles(dir);
  } catch {
    return {
      count: 0,
      problems: [{ file: dir, message: "news folder not found" }],
    };
  }

  const problems: NewsProblem[] = [];
  for (const file of files) {
    try {
      readNewsEntry(dir, file);
    } catch (error) {
      problems.push({ file, message: messageOf(error, file) });
    }
  }
  return { count: files.length, problems };
}
