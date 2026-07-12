import { getDict, type Locale, type Dict } from "@/lib/i18n";

/** 界面固定中文；保留函数签名以兼容历史调用。 */
export async function getLocale(): Promise<Locale> {
  return "zh";
}

export async function getT(): Promise<{ locale: Locale; t: Dict }> {
  return { locale: "zh", t: getDict() };
}
