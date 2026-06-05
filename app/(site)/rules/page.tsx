import Link from "next/link";
import { RULES_en, RULES_zh, RULES_lzh, LIABILITY_WAIVER_en, LIABILITY_WAIVER_zh, LIABILITY_WAIVER_lzh } from "@/lib/rules";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function RulesPage() {
  const { locale, t } = await getServerTranslations();
  const rules = locale === "zh" ? RULES_zh : locale === "lzh" ? RULES_lzh : RULES_en;
  const liabilityWaiver = locale === "zh" ? LIABILITY_WAIVER_zh : locale === "lzh" ? LIABILITY_WAIVER_lzh : LIABILITY_WAIVER_en;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6">
        <Link href="/" className="font-mono text-xs text-[var(--color-muted)] hover:underline">
          {t("nav.home")}
        </Link>
        <h1 className="mt-1 font-mono text-xl lowercase tracking-tight">{t("rules.title")}</h1>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-4">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--color-danger)]">
          {t("rules.liability_waiver")}
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-text)]">{liabilityWaiver}</p>
      </div>

      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-[var(--color-muted)]">
        {rules.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ol>
    </main>
  );
}
