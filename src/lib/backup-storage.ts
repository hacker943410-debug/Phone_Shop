import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const backupSettingsFilePath = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  ".data",
  "backup-settings.json",
);

const backupFilePrefix = "phoneshop-backup-";
const backupFileExtension = ".db";

export const defaultBackupDirectory = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "backups",
);

export interface BackupSettings {
  backupDirectory: string | null;
}

export interface BackupFileRecord {
  absolutePath: string;
  createdAt: Date;
  fileName: string;
  sizeBytes: number;
}

function normalizeDirectoryPath(directory: string) {
  return path.normalize(
    path.isAbsolute(directory)
      ? directory
      : path.resolve(/* turbopackIgnore: true */ process.cwd(), directory),
  );
}

function createBackupFileName(date: Date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${backupFilePrefix}${year}${month}${day}-${hour}${minute}${second}${backupFileExtension}`;
}

function isValidBackupFileName(fileName: string) {
  return (
    path.basename(fileName) === fileName &&
    fileName.startsWith(backupFilePrefix) &&
    fileName.endsWith(backupFileExtension)
  );
}

function parseBackupCreatedAt(fileName: string, fallbackDate: Date) {
  const timestamp = fileName
    .slice(backupFilePrefix.length, -backupFileExtension.length)
    .trim();
  const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(timestamp);

  if (!match) {
    return fallbackDate;
  }

  const createdAt = new Date(
    Number.parseInt(match[1] ?? "0", 10),
    Number.parseInt(match[2] ?? "0", 10) - 1,
    Number.parseInt(match[3] ?? "0", 10),
    Number.parseInt(match[4] ?? "0", 10),
    Number.parseInt(match[5] ?? "0", 10),
    Number.parseInt(match[6] ?? "0", 10),
  );

  return Number.isNaN(createdAt.getTime()) ? fallbackDate : createdAt;
}

export function resolveDatabaseFilePath(
  databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db",
) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("sqlite-only");
  }

  const rawPath = decodeURIComponent(databaseUrl.slice(5));
  return normalizeDirectoryPath(rawPath);
}

export function resolveBackupDirectoryPath(input: string) {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error("backup-path-required");
  }

  return normalizeDirectoryPath(trimmedInput);
}

export async function readBackupSettings(): Promise<BackupSettings> {
  try {
    const fileContents = await readFile(backupSettingsFilePath, "utf8");
    const parsed = JSON.parse(fileContents) as Partial<BackupSettings>;

    return {
      backupDirectory:
        typeof parsed.backupDirectory === "string" &&
        parsed.backupDirectory.trim().length > 0
          ? normalizeDirectoryPath(parsed.backupDirectory)
          : null,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { backupDirectory: null };
    }

    return { backupDirectory: null };
  }
}

export async function saveBackupSettings(rawDirectory: string) {
  const backupDirectory = resolveBackupDirectoryPath(rawDirectory);

  await mkdir(backupDirectory, { recursive: true });
  await mkdir(path.dirname(backupSettingsFilePath), { recursive: true });
  await writeFile(
    backupSettingsFilePath,
    JSON.stringify({ backupDirectory }, null, 2),
    "utf8",
  );

  return { backupDirectory };
}

export async function listBackupFiles(
  backupDirectory: string | null,
): Promise<BackupFileRecord[]> {
  if (!backupDirectory) {
    return [];
  }

  try {
    const entries = await readdir(backupDirectory, { withFileTypes: true });
    const backupFiles = await Promise.all(
      entries
        .filter(
          (entry) => entry.isFile() && isValidBackupFileName(entry.name),
        )
        .map(async (entry) => {
          const absolutePath = path.join(backupDirectory, entry.name);
          const fileStats = await stat(absolutePath);

          return {
            absolutePath,
            createdAt: parseBackupCreatedAt(entry.name, fileStats.birthtime),
            fileName: entry.name,
            sizeBytes: fileStats.size,
          } satisfies BackupFileRecord;
        }),
    );

    return backupFiles.sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export async function createDatabaseBackup(backupDirectory: string) {
  await mkdir(backupDirectory, { recursive: true });

  const sourceDatabasePath = resolveDatabaseFilePath();
  const createdAt = new Date();
  const fileName = createBackupFileName(createdAt);
  const backupPath = path.join(backupDirectory, fileName);

  await copyFile(sourceDatabasePath, backupPath);

  const fileStats = await stat(backupPath);

  return {
    absolutePath: backupPath,
    createdAt,
    fileName,
    sizeBytes: fileStats.size,
  } satisfies BackupFileRecord;
}

export async function restoreDatabaseBackup(
  backupDirectory: string,
  fileName: string,
) {
  if (!isValidBackupFileName(fileName)) {
    throw new Error("backup-file-missing");
  }

  const backupPath = path.join(backupDirectory, fileName);

  try {
    await stat(backupPath);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error("backup-file-missing");
    }

    throw error;
  }

  const databasePath = resolveDatabaseFilePath();

  await rm(`${databasePath}-journal`, { force: true });
  await rm(`${databasePath}-wal`, { force: true });
  await rm(`${databasePath}-shm`, { force: true });
  await copyFile(backupPath, databasePath);

  return {
    absolutePath: backupPath,
    fileName,
  };
}

export function formatBackupCreatedAt(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatBackupSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const sizeInKb = sizeBytes / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  const sizeInMb = sizeInKb / 1024;

  return `${sizeInMb.toFixed(2)} MB`;
}
