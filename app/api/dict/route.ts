import "server-only";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOEDICT = "https://www.moedict.tw/a";

// Simplified → Traditional for chars common in classical Chinese text
const S2T: Record<string, string> = {
  "无": "無", "为": "為", "约": "約", "来": "來", "时": "時",
  "义": "義", "从": "從", "历": "歷", "举": "舉", "乱": "亂",
  "亲": "親", "传": "傳", "别": "別", "则": "則", "动": "動",
  "华": "華", "听": "聽", "后": "後", "处": "處", "发": "發",
  "问": "問", "长": "長", "开": "開", "关": "關", "过": "過",
  "学": "學", "实": "實", "说": "說", "话": "話", "语": "語",
  "变": "變", "显": "顯", "难": "難", "继": "繼", "纪": "紀",
  "纠": "糾", "弹": "彈", "报": "報", "这": "這", "该": "該",
};

function toTraditional(ch: string): string {
  return S2T[ch] ?? ch;
}

function extractDefinition(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/【[^】]*】/g, "")
    .replace(/[▸▷△◆◉`~]/g, "")
    .replace(/^\s*\d+[.、]\s*/m, "")
    .trim()
    .split(/[。！？]/)[0]
    .trim() + "。";
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length === 0 || q.length > 8) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Convert each char to Traditional for moedict lookup
  const trad = [...q].map(toTraditional).join("");

  try {
    const res = await fetch(`${MOEDICT}/${encodeURIComponent(trad)}.json`, {
      headers: { Accept: "application/json", "User-Agent": "xhw-life/1.0" },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });

    const data = await res.json();
    const firstHet = Array.isArray(data.h) ? data.h[0] : null;
    if (!firstHet) return NextResponse.json({ error: "no entry" }, { status: 404 });

    const pinyin: string = firstHet.p ?? "";
    const rawDef: string = firstHet.d?.[0]?.f ?? "";
    const definition = extractDefinition(rawDef);

    if (!definition || definition === "。") {
      return NextResponse.json({ error: "empty" }, { status: 404 });
    }

    return NextResponse.json({ pinyin, definition });
  } catch {
    return NextResponse.json({ error: "upstream error" }, { status: 502 });
  }
}
