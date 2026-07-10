// Supabase Storage 上传封装。
// 直接调用 Supabase 的 Storage REST 接口，不额外引入 SDK 依赖，方便在 Vercel 上运行。
// 需要在环境变量里配置：
//   SUPABASE_URL              例如 https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY Supabase 后台 Project Settings → API 里的 service_role key
//   SUPABASE_STORAGE_BUCKET   存储桶名，默认 project-files（需在 Supabase 后台先建好并设为 public）

const DEFAULT_BUCKET = "project-files";

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;
}

export function isStorageConfigured() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return url.startsWith("http") && key.length > 20;
}

function getBaseUrl() {
  return (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
}

function safeName(name: string) {
  // 存储路径只保留常见安全字符，避免中文/空格导致的路径问题；保留扩展名。
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

/**
 * 把文件上传到 Supabase Storage，返回可直接访问的公开 URL。
 * 失败时抛出错误，由调用方处理。
 */
export async function uploadToBucket(
  file: File,
  folder = "uploads",
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error("storage-not-configured");
  }

  const base = getBaseUrl();
  const bucket = getStorageBucket();
  const path = `${folder}/${safeName(file.name || "file")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const res = await fetch(
    `${base}/storage/v1/object/${bucket}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buffer,
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`upload-failed: ${res.status} ${detail}`);
  }

  return `${base}/storage/v1/object/public/${bucket}/${encodeURI(path)}`;
}
