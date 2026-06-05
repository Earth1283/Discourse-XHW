import { describe, it, expect } from "vitest";
import { renderBody } from "@/lib/format/render";

describe("renderBody", () => {
  it("plain text → single line, no greentext", () => {
    const lines = renderBody("hello world");
    expect(lines).toHaveLength(1);
    expect(lines[0].greentext).toBe(false);
    expect(lines[0].segments).toEqual([{ t: "text", v: "hello world" }]);
  });

  it("greentext line starts with > (not >>)", () => {
    const lines = renderBody(">feels bad man");
    expect(lines[0].greentext).toBe(true);
  });

  it(">>id quote is not greentext", () => {
    const lines = renderBody(">>abc123");
    expect(lines[0].greentext).toBe(false);
    expect(lines[0].segments[0]).toMatchObject({ t: "quote", postId: "abc123" });
  });

  it("url segment inside text", () => {
    const lines = renderBody("check https://example.com out");
    const segs = lines[0].segments;
    expect(segs.find((s) => s.t === "link")).toMatchObject({
      t: "link",
      v: "https://example.com",
    });
  });

  it("[s]spoiler[/s] becomes spoiler segment", () => {
    const lines = renderBody("[s]hidden[/s]");
    expect(lines[0].segments[0]).toMatchObject({ t: "spoiler" });
    const spoiler = lines[0].segments[0] as { t: "spoiler"; children: { t: string; v: string }[] };
    expect(spoiler.children[0]).toMatchObject({ t: "text", v: "hidden" });
  });

  it("multi-line body splits into multiple lines", () => {
    const lines = renderBody("line1\nline2\nline3");
    expect(lines).toHaveLength(3);
  });

  it("mixed: greentext + quote on different lines", () => {
    const lines = renderBody(">nice\n>>abc1234\nnormal");
    expect(lines[0].greentext).toBe(true);
    expect(lines[1].greentext).toBe(false);
    expect(lines[1].segments[0]).toMatchObject({ t: "quote" });
    expect(lines[2].greentext).toBe(false);
  });
});
