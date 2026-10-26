import { ZodError } from "zod";

import { checkNewsEntries } from "../src/lib/news/check-news";

const SECTION_COUNT = 8;

function describeProblem(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
  }
  return error instanceof Error ? error.message : String(error);
}

async function checkSections(): Promise<string | null> {
  try {
    await import("../src/lib/content");
    return null;
  } catch (error) {
    return describeProblem(error);
  }
}

async function main(): Promise<number> {
  const newsDir = process.argv[2];
  const news = checkNewsEntries(newsDir);
  const sectionProblem = newsDir ? null : await checkSections();

  for (const problem of news.problems) {
    console.error(`content/news/${problem.file}: ${problem.message}`);
  }
  if (sectionProblem) console.error(`content/: ${sectionProblem}`);

  const failures = news.problems.length + (sectionProblem ? 1 : 0);
  if (failures > 0) {
    console.error(`\ncontent:check found ${failures} problem(s).`);
    return 1;
  }
  const sections = newsDir ? "" : `, ${SECTION_COUNT} content files`;
  console.log(`content:check passed (${news.count} news entries${sections}).`);
  return 0;
}

main().then((code) => process.exit(code));
