import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Item({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm text-[var(--color-muted)]">
      {label && (
        <span className="mt-px shrink-0 font-mono text-[var(--color-text)]">{label}</span>
      )}
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

function CodeItem({ code, desc }: { code: string; desc: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3 text-sm">
      <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[var(--color-accent)]">
        {code}
      </code>
      <span className="text-[var(--color-muted)]">{desc}</span>
    </div>
  );
}

export default async function HelpPage() {
  const { t } = await getServerTranslations();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="font-mono text-xs text-[var(--color-muted)] hover:underline">
          {t("nav.home")}
        </Link>
        <h1 className="mt-1 font-mono text-xl lowercase tracking-tight">{t("help.title")}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t("help.intro")}</p>
      </div>

      <Section title={t("help.section.posting")}>
        <Item>{t("help.posting.anonymous")}</Item>
        <Item>{t("help.posting.handle")}</Item>
        <Item>{t("help.posting.sage")}</Item>
        <Item>{t("help.posting.image")}</Item>
        <Item>{t("help.posting.self_delete")}</Item>
      </Section>

      <Section title={t("help.section.formatting")}>
        <CodeItem code=">" desc={t("help.fmt.greentext")} />
        <CodeItem code=">>id" desc={t("help.fmt.quote")} />
        <CodeItem code="[s]…[/s]" desc={t("help.fmt.spoiler")} />
        <Item>{t("help.fmt.url")}</Item>
      </Section>

      <Section title={t("help.section.identity")}>
        <Item>{t("help.identity.token")}</Item>
        <Item>{t("help.identity.tripcode")}</Item>
        <Item>{t("help.identity.handle")}</Item>
      </Section>

      <Section title={t("help.section.rules")}>
        <Item>
          <Link href="/rules" className="text-[var(--color-accent)] hover:underline">
            {t("help.rules.link")}
          </Link>
        </Item>
        <Item>{t("help.rules.report")}</Item>
        <Item>{t("help.rules.ban")}</Item>
      </Section>

      <Section title={t("help.section.search")}>
        <Item>{t("help.search.desc")}</Item>
      </Section>

      <Section title={t("help.section.misc")}>
        <Item>{t("help.misc.theme")}</Item>
        <Item>{t("help.misc.lang")}</Item>
        <Item>{t("help.misc.catalog")}</Item>
      </Section>
    </main>
  );
}
