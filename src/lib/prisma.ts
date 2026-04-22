import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient as PrismaClientClass } from "../../prisma/generated/client/client";

type PrismaClient = InstanceType<typeof PrismaClientClass>;

const adapter = new PrismaBetterSqlite3(
  { url: process.env.DATABASE_URL || "file:./prisma/dev.db" },
  { timestampFormat: "unixepoch-ms" },
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClientClass({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function hasRequiredDelegates(
  client: PrismaClient | undefined,
): client is PrismaClient {
  if (!client) {
    return false;
  }

  // In dev, a globally cached client can survive schema changes and miss new delegates
  // until the process is restarted. Rebuild it when the current schema's delegate is absent.
  const delegateAwareClient = client as PrismaClient & {
    manualSchedule?: { findMany?: unknown };
    salesAgency?: { findMany?: unknown };
  };

  return (
    typeof delegateAwareClient.manualSchedule?.findMany === "function" &&
    typeof delegateAwareClient.salesAgency?.findMany === "function"
  );
}

function getPrismaClient() {
  const cachedPrisma = globalForPrisma.prisma;

  if (hasRequiredDelegates(cachedPrisma)) {
    return cachedPrisma;
  }

  return createPrismaClient();
}

export const prisma: PrismaClient = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
