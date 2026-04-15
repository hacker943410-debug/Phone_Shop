import fs from "node:fs";
import path from "node:path";

import { config as loadDotenv } from "dotenv";

const projectRoot = process.cwd();

for (const fileName of [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
]) {
  const filePath = path.join(projectRoot, fileName);

  if (fs.existsSync(filePath)) {
    loadDotenv({ path: filePath, override: true, quiet: true });
  }
}

const supportedTargets = new Set(["node", "docker", "vercel"]);
const inlineTargetArg = process.argv.find((value) =>
  value.startsWith("--target="),
);
const targetArgIndex = process.argv.findIndex((value) => value === "--target");
const target =
  inlineTargetArg?.split("=", 2)[1]?.toLowerCase() ??
  (targetArgIndex >= 0 ? process.argv[targetArgIndex + 1]?.toLowerCase() : "node");

if (!supportedTargets.has(target)) {
  console.error(
    `Unsupported target "${target ?? ""}". Use one of: node, docker, vercel.`,
  );
  process.exit(1);
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
);
const envExample = fs.readFileSync(
  path.join(projectRoot, ".env.example"),
  "utf8",
);
const prismaSource = fs.readFileSync(
  path.join(projectRoot, "src", "lib", "prisma.ts"),
  "utf8",
);

const sessionSecret = process.env.SESSION_SECRET?.trim() ?? "";
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const usesLocalSqliteAdapter = prismaSource.includes("PrismaBetterSqlite3");
const usesFileDatabase = databaseUrl.startsWith("file:");

const checks = [];

function addCheck(status, title, detail) {
  checks.push({ status, title, detail });
}

function hasScript(name) {
  return typeof packageJson.scripts?.[name] === "string";
}

function runGitRemoteCheck() {
  const gitConfigPath = path.join(projectRoot, ".git", "config");

  if (!fs.existsSync(gitConfigPath)) {
    return false;
  }

  const gitConfig = fs.readFileSync(gitConfigPath, "utf8");
  return gitConfig.includes('[remote "origin"]');
}

if (hasScript("build") && hasScript("start")) {
  addCheck("PASS", "Next.js production scripts", "build/start scripts are present.");
} else {
  addCheck(
    "FAIL",
    "Next.js production scripts",
    "package.json must define both build and start scripts.",
  );
}

if (
  envExample.includes("DATABASE_URL") &&
  envExample.includes("SESSION_SECRET")
) {
  addCheck("PASS", ".env.example coverage", "Required server env keys are documented.");
} else {
  addCheck(
    "FAIL",
    ".env.example coverage",
    "Add DATABASE_URL and SESSION_SECRET to .env.example.",
  );
}

if (!sessionSecret) {
  addCheck(
    "FAIL",
    "SESSION_SECRET",
    "SESSION_SECRET is missing. Set a long random secret before deployment.",
  );
} else if (
  sessionSecret === "replace-with-a-random-secret" ||
  sessionSecret === "phoneshop-dev-session-secret-change-me"
) {
  addCheck(
    "FAIL",
    "SESSION_SECRET",
    "SESSION_SECRET still uses a development placeholder value.",
  );
} else {
  addCheck("PASS", "SESSION_SECRET", "SESSION_SECRET is configured.");
}

if (!databaseUrl) {
  addCheck(
    "FAIL",
    "DATABASE_URL",
    "DATABASE_URL is missing. Configure the production database connection.",
  );
} else if (target === "vercel" && usesLocalSqliteAdapter) {
  addCheck(
    "FAIL",
    "Database strategy for Vercel",
    "The app uses PrismaBetterSqlite3, which is a local SQLite adapter. Move to a durable hosted database before targeting Vercel.",
  );
} else if (usesFileDatabase) {
  addCheck(
    target === "vercel" ? "FAIL" : "WARN",
    "SQLite file database",
    "DATABASE_URL points to a local SQLite file. Use a persistent volume for node/docker deployments.",
  );
} else {
  addCheck("PASS", "DATABASE_URL", "Database URL is configured for a non-file database.");
}

if (runGitRemoteCheck()) {
  addCheck("PASS", "Git remote", "A Git remote is already configured.");
} else {
  addCheck(
    "WARN",
    "Git remote",
    "No Git remote detected. Connect the repository before release work.",
  );
}

const vercelProjectPath = path.join(projectRoot, ".vercel", "project.json");
if (target === "vercel") {
  if (fs.existsSync(vercelProjectPath)) {
    addCheck("PASS", "Vercel project link", ".vercel/project.json is present.");
  } else {
    addCheck(
      "FAIL",
      "Vercel project link",
      "Run vercel link after the database strategy is ready for Vercel.",
    );
  }
}

if (hasScript("check")) {
  addCheck("PASS", "Quality gate", "pnpm check is available for deploy preflight.");
} else {
  addCheck(
    "WARN",
    "Quality gate",
    "Add a single command that runs lint, typecheck, and unit tests.",
  );
}

const statusSymbol = {
  PASS: "[PASS]",
  WARN: "[WARN]",
  FAIL: "[FAIL]",
};

console.log(`PhoneShop deploy preflight (${target})`);
console.log("");

for (const check of checks) {
  console.log(`${statusSymbol[check.status]} ${check.title}: ${check.detail}`);
}

const failCount = checks.filter((check) => check.status === "FAIL").length;
const warnCount = checks.filter((check) => check.status === "WARN").length;

console.log("");
console.log(`Summary: ${failCount} fail, ${warnCount} warn.`);

if (failCount > 0) {
  process.exit(1);
}
