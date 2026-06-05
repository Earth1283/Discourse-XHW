import { cookies, headers } from "next/headers";
import { locales, translate, type Locale } from "./locales";

export async function getServerLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    const cookieLocale = jar.get("xhw_locale")?.value;
    if (cookieLocale === "en" || cookieLocale === "zh" || cookieLocale === "lzh") {
      return cookieLocale as Locale;
    }
  } catch (e) {
    // cookies() might fail if called outside Request context (e.g. static builds)
  }

  try {
    const reqHeaders = await headers();
    const acceptLang = reqHeaders.get("accept-language") || "";
    if (acceptLang.toLowerCase().includes("zh")) {
      return "zh";
    }
  } catch (e) {
    // headers() might also fail
  }

  return "en";
}

export async function getServerTranslations() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (key: keyof typeof locales.en, variables?: Record<string, string | number>) => {
      return translate(locale, key, variables);
    },
  };
}
