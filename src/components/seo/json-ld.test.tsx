import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  it("renders the data as a JSON-LD script that the browser does not run", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ name: "Example Studio" }} />,
    );

    expect(html).toBe(
      '<script type="application/ld+json">{"name":"Example Studio"}</script>',
    );
  });

  it("cannot be broken out of by text in the data", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ name: "</script><img src=x>" }} />,
    );

    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain("<img");
  });
});
