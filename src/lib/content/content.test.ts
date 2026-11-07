import { describe, expect, it } from "vitest";

import { privacy as rawPrivacy } from "@content/privacy";
import { contact as rawContact } from "@content/sections/contact";
import { inversion as rawInversion } from "@content/sections/inversion";
import { news as rawNews } from "@content/sections/news";
import { pipeline as rawPipeline } from "@content/sections/pipeline";
import { tools as rawTools } from "@content/sections/tools";
import { site as rawSite } from "@content/site";

import {
  contact,
  hero,
  inversion,
  news,
  pipeline,
  privacy,
  site,
  tools,
} from "./index";
import {
  contactContentSchema,
  inversionSchema,
  newsSchema,
  pipelineSchema,
  privacySchema,
  siteSchema,
  toolsSchema,
} from "./schema";

describe("content", () => {
  it("loads every section", () => {
    const sections = [
      site,
      hero,
      inversion,
      news,
      pipeline,
      tools,
      contact,
      privacy,
    ];
    for (const section of sections) expect(section).toBeDefined();
  });

  it("rejects a news section that shows no entries per page", () => {
    const broken = { ...rawNews, perPage: 0 };
    expect(newsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a news section with a page size that is not a whole number", () => {
    const broken = { ...rawNews, perPage: 2.5 };
    expect(newsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a news section without labels for the pager buttons", () => {
    const broken = { ...rawNews, pager: undefined };
    expect(newsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects two pipeline stages with the same id", () => {
    const first = rawPipeline.stages[0];
    const broken = { ...rawPipeline, stages: [first, first] };
    expect(pipelineSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects two tools with the same id", () => {
    const first = rawTools.entries[0];
    const broken = { ...rawTools, entries: [first, first] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a tool without tags", () => {
    const entry = { ...rawTools.entries[0], tags: [] };
    const broken = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a tools section without any tool", () => {
    const broken = { ...rawTools, entries: [] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("accepts a tool without a repository url", () => {
    const entry = { ...rawTools.entries[0], repoUrl: undefined };
    const ok = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(ok).success).toBe(true);
  });

  it.each([
    "http://github.com/nokgc333/pipeinit",
    "https://example.com/nokgc333/pipeinit",
    "https://github.com.example.com/nokgc333/pipeinit",
    "javascript:alert(1)",
    "github.com/nokgc333/pipeinit",
  ])("rejects the repository url %s", (repoUrl) => {
    const entry = { ...rawTools.entries[0], repoUrl };
    const broken = { ...rawTools, entries: [entry] };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a repository link label that has no place for the tool name", () => {
    const broken = { ...rawTools, repoLinkLabel: "GitHubリポジトリ" };
    expect(toolsSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a site url that is not a url", () => {
    const broken = { ...rawSite, url: "example.test" };
    expect(siteSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an empty site name", () => {
    expect(siteSchema.safeParse({ ...rawSite, name: "" }).success).toBe(false);
  });

  describe("privacy policy", () => {
    const withSection = (section: unknown) => ({
      ...rawPrivacy,
      sections: [section],
    });
    const paragraph = { kind: "paragraph", text: "text" };

    it("accepts paragraphs and lists, nested as deep as written", () => {
      const nested = withSection({
        heading: "第1. h",
        blocks: [
          paragraph,
          {
            kind: "list",
            style: "number",
            items: [
              {
                text: "a",
                children: [{ text: "a-1", children: [{ text: "a-1-1" }] }],
              },
              { text: "b" },
            ],
          },
          { kind: "list", style: "bullet", items: [{ text: "c" }] },
        ],
      });
      expect(privacySchema.safeParse(nested).success).toBe(true);
    });

    it("rejects a policy without a lead", () => {
      const withoutLead = Object.fromEntries(
        Object.entries(rawPrivacy).filter(([key]) => key !== "lead"),
      );
      expect(privacySchema.safeParse(withoutLead).success).toBe(false);
    });

    it("rejects a policy without any section", () => {
      expect(
        privacySchema.safeParse({ ...rawPrivacy, sections: [] }).success,
      ).toBe(false);
    });

    it("rejects a section without blocks", () => {
      expect(
        privacySchema.safeParse(withSection({ heading: "h", blocks: [] }))
          .success,
      ).toBe(false);
    });

    it("rejects an empty paragraph", () => {
      const broken = withSection({
        heading: "h",
        blocks: [{ kind: "paragraph", text: "" }],
      });
      expect(privacySchema.safeParse(broken).success).toBe(false);
    });

    it("rejects a list without items", () => {
      const broken = withSection({
        heading: "h",
        blocks: [{ kind: "list", style: "bullet", items: [] }],
      });
      expect(privacySchema.safeParse(broken).success).toBe(false);
    });

    it("rejects a list item without text, at any depth", () => {
      const broken = withSection({
        heading: "h",
        blocks: [
          {
            kind: "list",
            style: "number",
            items: [{ text: "a", children: [{ text: "" }] }],
          },
        ],
      });
      expect(privacySchema.safeParse(broken).success).toBe(false);
    });

    it("rejects a list item with an empty list of children", () => {
      const broken = withSection({
        heading: "h",
        blocks: [
          {
            kind: "list",
            style: "number",
            items: [{ text: "a", children: [] }],
          },
        ],
      });
      expect(privacySchema.safeParse(broken).success).toBe(false);
    });

    it("rejects a list with an unknown style", () => {
      const broken = withSection({
        heading: "h",
        blocks: [{ kind: "list", style: "roman", items: [{ text: "a" }] }],
      });
      expect(privacySchema.safeParse(broken).success).toBe(false);
    });

    it("rejects a block of an unknown kind", () => {
      const broken = withSection({
        heading: "h",
        blocks: [{ kind: "image", text: "a" }],
      });
      expect(privacySchema.safeParse(broken).success).toBe(false);
    });

    it("rejects a date that is not a date", () => {
      expect(
        privacySchema.safeParse({ ...rawPrivacy, updated: "2026-13-40" })
          .success,
      ).toBe(false);
    });
  });

  it("rejects a consent sentence that does not contain the text to link", () => {
    const broken = {
      ...rawContact,
      consentLink: { ...rawContact.consentLink, text: "not in the sentence" },
    };
    expect(contactContentSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a contact section without the consent link", () => {
    const broken = { ...rawContact, consentLink: undefined };
    expect(contactContentSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a consent link without the note for the new tab", () => {
    const broken = {
      ...rawContact,
      consentLink: { ...rawContact.consentLink, note: "" },
    };
    expect(contactContentSchema.safeParse(broken).success).toBe(false);
  });

  it("links a part of the real consent sentence", () => {
    expect(contact.fields.consent).toContain(contact.consentLink.text);
  });

  describe("inversion statements", () => {
    const withBody = (body: unknown) => ({ ...rawInversion, body });

    it("accepts a statement with a lead and a highlighted phrase", () => {
      const body = [
        { lead: "lead,", main: "main with key words", highlight: "key" },
      ];
      expect(inversionSchema.safeParse(withBody(body)).success).toBe(true);
    });

    it("accepts a statement with only a main text", () => {
      expect(
        inversionSchema.safeParse(withBody([{ main: "only the main" }]))
          .success,
      ).toBe(true);
    });

    it("accepts a statement with a tail after the main text", () => {
      const body = [{ main: "main", tail: "and the tail." }];
      expect(inversionSchema.safeParse(withBody(body)).success).toBe(true);
    });

    it("rejects a statement whose tail is empty", () => {
      expect(
        inversionSchema.safeParse(withBody([{ main: "main", tail: "" }]))
          .success,
      ).toBe(false);
    });

    it("rejects a highlighted phrase that is not in the main text", () => {
      const body = [{ main: "main text", highlight: "elsewhere" }];
      expect(inversionSchema.safeParse(withBody(body)).success).toBe(false);
    });

    it("rejects a statement whose main text is empty", () => {
      expect(inversionSchema.safeParse(withBody([{ main: "" }])).success).toBe(
        false,
      );
    });

    it("rejects a statement whose lead is empty", () => {
      expect(
        inversionSchema.safeParse(withBody([{ lead: "", main: "main" }]))
          .success,
      ).toBe(false);
    });

    it("rejects a section without statements", () => {
      expect(inversionSchema.safeParse(withBody([])).success).toBe(false);
    });

    it("keeps the real statements free of newlines", () => {
      for (const statement of inversion.body)
        expect(JSON.stringify(statement)).not.toContain("\\n");
    });

    it("highlights a phrase that the real statements contain", () => {
      for (const statement of inversion.body)
        if (statement.highlight)
          expect(statement.main).toContain(statement.highlight);
    });
  });
});
