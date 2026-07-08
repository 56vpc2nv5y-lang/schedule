import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "项目跟踪看板",
  description: "技术合作项目的全生命周期跟踪控制台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
