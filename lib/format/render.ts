// Render-safe transformation of raw post bodies into typed segments.
// We store raw text and tokenize at display time — the React component maps
// segments to JSX elements, so we never inject HTML strings.

export type Segment =
  | { t: "text"; v: string }
  | { t: "quote"; postId: string }
  | { t: "link"; v: string }
  | { t: "spoiler"; children: Segment[] };

const URL_RE = /(https?:\/\/[^\s<]+)/g;
const QUOTE_RE = />>([a-zA-Z0-9_-]{4,20})/g;
const SPOILER_RE = /\[s\]([\s\S]*?)\[\/s\]/g;

/** Split a single line (no spoilers) into text/quote/link segments. */
function tokenizeBasics(text: string): Segment[] {
  const out: Segment[] = [];
  // First pass: split on quote-links, preserving them.
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  QUOTE_RE.lastIndex = 0;
  const pieces: Array<{ text: string } | { quote: string }> = [];
  while ((m = QUOTE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) pieces.push({ text: text.slice(lastIndex, m.index) });
    pieces.push({ quote: m[1]! });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) pieces.push({ text: text.slice(lastIndex) });

  // Second pass: within text pieces, split out URLs.
  for (const p of pieces) {
    if ("quote" in p) {
      out.push({ t: "quote", postId: p.quote });
      continue;
    }
    let li = 0;
    let um: RegExpExecArray | null;
    URL_RE.lastIndex = 0;
    while ((um = URL_RE.exec(p.text)) !== null) {
      if (um.index > li) out.push({ t: "text", v: p.text.slice(li, um.index) });
      out.push({ t: "link", v: um[1]! });
      li = um.index + um[0].length;
    }
    if (li < p.text.length) out.push({ t: "text", v: p.text.slice(li) });
  }
  return out;
}

/** Tokenize a line including [s]spoiler[/s] regions. */
function tokenizeInline(line: string): Segment[] {
  const out: Segment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  SPOILER_RE.lastIndex = 0;
  while ((m = SPOILER_RE.exec(line)) !== null) {
    if (m.index > lastIndex) out.push(...tokenizeBasics(line.slice(lastIndex, m.index)));
    out.push({ t: "spoiler", children: tokenizeBasics(m[1]!) });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < line.length) out.push(...tokenizeBasics(line.slice(lastIndex)));
  return out;
}

export type Line = { greentext: boolean; segments: Segment[] };

/** Parse a full post body into lines of segments. */
export function renderBody(body: string): Line[] {
  return body.split("\n").map((line) => {
    if (line.startsWith(">") && !line.startsWith(">>")) {
      return { greentext: true, segments: tokenizeInline(line) };
    }
    return { greentext: false, segments: tokenizeInline(line) };
  });
}
