"use client";

import { useState } from "react";
import { Link2, Star, Upload } from "lucide-react";
import { createResourceAction, uploadResourceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResourceCreatePanel({
  categories,
  storageReady,
}: {
  categories: string[];
  storageReady: boolean;
}) {
  const [mode, setMode] = useState<"upload" | "link">(
    storageReady ? "upload" : "link",
  );

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border bg-secondary/50 p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === "upload" ? "default" : "ghost"}
          onClick={() => setMode("upload")}
          disabled={!storageReady}
          title={storageReady ? "上传本地文件" : "请先在设置中配置 Supabase Storage"}
        >
          <Upload className="h-4 w-4" />
          上传文件
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "link" ? "default" : "ghost"}
          onClick={() => setMode("link")}
        >
          <Link2 className="h-4 w-4" />
          登记链接
        </Button>
      </div>

      {mode === "upload" ? (
        <form action={uploadResourceAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-3">
            <span className="flabel">选择文件（最大 20MB）</span>
            <input name="file" type="file" required className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">显示名称（可不填）</span>
            <input name="name" className="field" placeholder="默认使用文件名" />
          </label>
          <CategorySelect categories={categories} />
          <label className="lg:col-span-4">
            <span className="flabel">备注</span>
            <input name="note" className="field" />
          </label>
          <ImportantCheck />
          <div className="flex items-end">
            <SubmitButton className="w-full" pendingLabel="上传中...">
              <Upload className="h-4 w-4" />
              上传并登记
            </SubmitButton>
          </div>
        </form>
      ) : (
        <form action={createResourceAction} className="grid gap-4 lg:grid-cols-6">
          <label className="lg:col-span-2">
            <span className="flabel">资料名称（必填）</span>
            <input name="name" required className="field" />
          </label>
          <CategorySelect categories={categories} />
          <label className="lg:col-span-3">
            <span className="flabel">链接</span>
            <input name="url" placeholder="https://" className="field" />
          </label>
          <label className="lg:col-span-4">
            <span className="flabel">备注</span>
            <input name="note" className="field" />
          </label>
          <ImportantCheck />
          <div className="flex items-end">
            <SubmitButton className="w-full">
              <Link2 className="h-4 w-4" />
              保存链接
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

function CategorySelect({ categories }: { categories: string[] }) {
  return (
    <label>
      <span className="flabel">分类</span>
      <select name="category" className="field" defaultValue="公司模板">
        {categories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
    </label>
  );
}

function ImportantCheck() {
  return (
    <label className="flex items-center gap-2 self-end text-sm">
      <input type="checkbox" name="important" className="h-4 w-4" />
      <Star className="h-3.5 w-3.5 text-amber-500" />
      标为常用
    </label>
  );
}
