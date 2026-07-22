import type { Metadata } from "next";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
import "./gantt-skin.css";
import "./comfort-skin.css";

export const metadata: Metadata = {
  title: "项目跟踪看板 · Project Tracker",
  description: "技术合作项目的全生命周期个人工作台",
  manifest: "/manifest.webmanifest",
  applicationName: "Sunny 看板",
  appleWebApp: { capable: true, title: "Sunny 看板" },
};

// 在页面绘制前读取用户选择的皮肤，避免切换时闪一下默认色
// 删除旧蓝墨蓝图后，将遗留选择迁移到更柔和的默认皮肤。
const skinScript = `try{var s=localStorage.getItem('skin');if(!['vibrant','sunset'].includes(s))s='vibrant';localStorage.setItem('skin',s);document.documentElement.setAttribute('data-skin',s)}catch(e){document.documentElement.setAttribute('data-skin','vibrant')}`;

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
