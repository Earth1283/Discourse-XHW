"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";

export function RelTime({ ts }: { ts: number }) {
  const [, setTick] = useState(0);
  const { locale } = useI18n();

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  function format(ts: number): string {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return locale === "zh" ? `${s}秒前` : `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return locale === "zh" ? `${m}分钟前` : `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return locale === "zh" ? `${h}小时前` : `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return locale === "zh" ? `${d}天前` : `${d}d`;
    return new Date(ts).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
  }

  return (
    <time dateTime={new Date(ts).toISOString()} title={new Date(ts).toLocaleString()}>
      {format(ts)}
    </time>
  );
}
