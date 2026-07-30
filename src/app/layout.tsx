import type { Metadata } from "next";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
import "./gantt-skin.css";
import "./comfort-skin.css";
import "./sunny-design-system.css";

export const metadata: Metadata = {
  title: "Sunny 工作系统",
  description: "国际业务推进、任务闭环、日历和个人素材沉淀工作台",
  manifest: "/manifest.webmanifest",
  applicationName: "Sunny 工作系统",
  appleWebApp: { capable: true, title: "Sunny 工作系统" },
};

const themeScript = `try{var theme=localStorage.getItem('sunny-theme')||'sunny-third';if(!['sunny-a','sunny-c','sunny-third'].includes(theme))theme='sunny-third';document.documentElement.dataset.theme=theme;document.documentElement.dataset.density=localStorage.getItem('sunny-density')||'comfortable';var skin=theme==='sunny-c'?'sunny-c':'sunny-a';document.documentElement.setAttribute('data-skin',skin)}catch(e){document.documentElement.dataset.theme='sunny-third';document.documentElement.dataset.density='comfortable';document.documentElement.setAttribute('data-skin','sunny-a')}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="sunny-third" data-density="comfortable" data-skin="sunny-a" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <PwaRegister />
        <LocaleProvider locale="zh">{children}</LocaleProvider>
      </body>
    </html>
  );
}