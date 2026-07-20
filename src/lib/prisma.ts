import { PrismaClient } from "@prisma/client";

const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);
const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function isTransientDatabaseError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    TRANSIENT_CODES.has(code) ||
    /can't reach database|connection.*closed|connection.*timeout|pool.*timeout/i.test(
      message,
    )
  );
}

function runtimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw || process.env.DATABASE_USE_TRANSACTION_POOLER === "true") {
    return raw;
  }

  try {
    const url = new URL(raw);
    const isLocalPersistentApp =
      !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
    const isSupabaseTransactionPool =
      url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543";

    if (isLocalPersistentApp && isSupabaseTransactionPool) {
      url.port = "5432";
      url.searchParams.delete("pgbouncer");
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "5");
      }
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "20");
      }
      return url.toString();
    }
  } catch {
    // Prisma will report a clear configuration error for an invalid URL.
  }
  return raw;
}

function createPrismaClient() {
  const datasourceUrl = runtimeDatabaseUrl();
  const base = new PrismaClient(
    datasourceUrl ? { datasourceUrl } : undefined,
  );

  return base.$extends({
    name: "transient-read-retry",
    query: {
      async $allOperations({ operation, args, query }) {
        const attempts = READ_OPERATIONS.has(operation) ? 3 : 1;
        let lastError: unknown;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (
              !isTransientDatabaseError(error) ||
              attempt === attempts - 1
            ) {
              throw error;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, [250, 750][attempt]),
            );
          }
        }
        throw lastError;
      },
    },
  });
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
};
const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getPrisma() {
  return prisma;
}
