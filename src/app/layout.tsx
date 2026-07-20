import type { Metadata } from "next";
import { LocaleProvider } from "@/components/layout/locale-provider";
import "./globals.css";
import "./blueprint-skin.css";
import "./comfort-skin.css";

export const metadata: Metadata = {
  title: "项目跟踪看板 · Project Tracker",
  description: "技术合作项目的全生命周期个人工作台",
};

// 在页面绘制前读取用户选择的皮肤，避免切换时闪一下默认色
// 只迁移一次到本轮已确认的蓝墨蓝图；之后继续尊重用户手动切换。
const skinScript = `try{var k='skin-blueprint-v1',s=localStorage.getItem('skin');if(localStorage.getItem(k)!=='1'){s='blueprint';localStorage.setItem('skin',s);localStorage.setItem(k,'1')}if(!['blueprint','vibrant','sunset'].includes(s))s='blueprint';document.documentElement.setAttribute('data-skin',s)}catch(e){document.documentElement.setAttribute('data-skin','blueprint')}`;

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
