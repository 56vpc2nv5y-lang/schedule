import type { Metadata } from "next";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
import "./gantt-skin.css";
import "./comfort-skin.css";
import "./sunny-design-system.css";

export const metadata: Metadata = {
  title: "Sunny 看板 / Project Tracker",
  description: "技术合作项目的全生命周期个人工作台",
  manifest: "/manifest.webmanifest",
  applicationName: "Sunny 看板",
  appleWebApp: { capable: true, title: "Sunny 看板" },
};

const skinScript = `try{var s=localStorage.getItem('skin');if(s==='sunset'||s==='vibrant')s='sunny-a';if(!['sunny-a','sunny-c'].includes(s))s='sunny-a';localStorage.setItem('skin',s);document.documentElement.setAttribute('data-skin',s)}catch(e){document.documentElement.setAttribute('data-skin','sunny-a')}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: skinScript }} />
        <PwaRegister />
        <LocaleProvider locale="zh">{children}</LocaleProvider>
      </body>
    </html>
  );
}
