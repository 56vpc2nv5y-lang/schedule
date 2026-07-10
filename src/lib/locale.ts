import { cookies } from "next/headers";
import { getDict, normalizeLocale, LOCALE_COOKIE, type Locale, type Dict } from "@/lib/i18n";

/** 服务端组件里取当前界面语言 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getT(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
