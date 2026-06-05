"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { RULES_VERSION } from "@/lib/rules";

const COOKIE = "xhw_rules_accepted";

export function RulesResetButton() {
  const router = useRouter();
  const { t } = useI18n();

  function reset() {
    // Expire the acceptance cookie → RulesGate will show on next page
    document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
    router.push("/");
  }

  return (
    <div className="mt-8 border-t border-[var(--color-border)] pt-6">
      <p className="mb-3 text-xs text-[var(--color-muted)]">{t("rules.re_accept_tip")}</p>
      <button
        onClick={reset}
        className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
      >
        {t("rules.re_accept")}
      </button>
    </div>
  );
}
