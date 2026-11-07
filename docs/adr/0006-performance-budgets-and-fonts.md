# ADR-0006: Performance is guarded by budgets measured on the CI, and the fonts stay as they are

- Status: accepted (2026-10-25), amended (2026-10-26)
- Related: `.lighthouserc.cjs`, `.github/workflows/ci.yml`, `src/app/fonts.ts`

## Context

The page is meant to feel fast, and a slower page should fail a pull request. Two things made this harder than expected: the hero is drawn in software on the CI (no graphics card), and the Japanese body font brings many small files.

## Decision

- Lighthouse CI measures the home page and the privacy page on a production build, mobile with the simulated slow connection, 3 runs each, and judges the median run. A budget that is exceeded fails the job (`Performance Budget`), which is a required check of the main branch.
- The budgets are the measured value plus a margin, and they are taken from the CI, not from a laptop with a graphics card:

| Page        | Score        | Largest paint | Script | Transfer | Blocking time |
| ----------- | ------------ | ------------- | ------ | -------- | ------------- |
| Home        | 0.25 or more | 9.5 s         | 520 KB | 1.3 MB   | 7.5 s         |
| Other pages | 0.8 or more  | 4.4 s         | 240 KB | 850 KB   | 450 ms        |

Layout shift stays at 0.1 or less everywhere. The home page values are loose on purpose: the scene is software rendered on the CI (blocking time 4 to 6 seconds, against about 0.2 seconds on real hardware). They guard against a large regression and are lowered when the cost of the scene drops.

- The latin fonts (a condensed sans and a mono) are preloaded. The Japanese font is not, and all fonts use `display: swap`. The fonts are not self-hosted and not subset: the Japanese family has about 490 small files, the fetch from the font host has not failed a CI build (it failed once in a local clean copy), and the page already ships only the slices it uses.
- The simulated largest paint (3.2 to 3.6 s on the home page) is not the real one: the observed value is 0.2 to 0.4 s. The budgets use the simulated value because it is what a pull request can compare.

## Measurements behind the decision

- Starting the scene in an idle period instead of on mount stabilized the CI result of the home page (score 0.3 to 0.62 before, 0.60 to 0.62 after; largest paint 3.2 to 8.3 s before, 3.2 to 3.3 s after).
- 66 of the 68 KB of render-blocking CSS are the font-face rules of the Japanese family. Dropping the bold weight saves 221 KB of transfer but did not change the simulated largest paint, so it was not done.
- A first set of budgets taken from a laptop failed twice on the CI; the lesson is to set budgets from the CI report.

## Consequences

- Good: a performance regression shows up in the pull request with a report; the numbers have a recorded source.
- Bad: the home page budgets are weak until the software rendering cost is reduced; the simulated largest paint stays above the 2.5 s target.

## Alternatives considered

- Self-hosting or subsetting the Japanese font: about 490 files, no failure to fix, and the fallback adjustment of the font loader would be lost.
- Dropping the bold Japanese weight: saves 221 KB but changes the look and not the largest paint.
- Budgets taken from a laptop: they failed on the CI twice.
- Measuring only by hand: a regression would reach the main branch unnoticed.

## Revisit when

- The scene gets cheaper to draw (lower the home page budgets in the same change).
- A font fetch ever fails a build (first add a retry of the build, then consider self-hosting).
