import type { Metadata } from "next";
import { LocaleProvider } from "@/components/layout/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "项目跟踪看板 · Project Tracker",
  description: "技术合作项目的全生命周期个人工作台",
};

// 在页面绘制前读取用户选择的皮肤，避免切换时闪一下默认色
const skinScript = `try{var s=localStorage.getItem('skin');if(s==='sunset')document.documentElement.setAttribute('data-skin','sunset');}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: skinScript }} />
        <LocaleProvider locale="zh">{children}</LocaleProvider>
      </body>
    </html>
  );
}
