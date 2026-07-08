import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-sm font-medium text-primary">404</div>
        <h1 className="mt-3 text-2xl font-semibold">页面不存在</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          这个项目入口还没有创建，或者链接已经失效。
        </p>
        <Link href="/">
          <Button className="mt-5">回到甘特总览</Button>
        </Link>
      </div>
    </main>
  );
}
