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
    if (s < 60) {
      if (locale === "zh" || locale === "lzh") return `${s}秒前`;
      return `${s}s`;
    }
    const m = Math.floor(s / 60);
    if (m < 60) {
      if (locale === "zh") return `${m}分钟前`;
      if (locale === "lzh") return `${m}分前`;
      return `${m}m`;
    }
    const h = Math.floor(m / 60);
    if (h < 24) {
      if (locale === "zh") return `${h}小时前`;
      if (locale === "lzh") return `${h}时前`;
      return `${h}h`;
    }
    const d = Math.floor(h / 24);
    if (d < 7) {
      if (locale === "zh") return `${d}天前`;
      if (locale === "lzh") return `${d}日前`;
      return `${d}d`;
    }
    return new Date(ts).toLocaleDateString(locale === "zh" || locale === "lzh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
  }

  return (
    <time dateTime={new Date(ts).toISOString()} title={new Date(ts).toLocaleString()}>
      {format(ts)}
    </time>
  );
}
