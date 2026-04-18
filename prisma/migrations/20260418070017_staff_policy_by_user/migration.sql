-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffCommissionPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "carrierId" TEXT,
    "staffId" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "calculationValue" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffCommissionPolicy_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StaffCommissionPolicy_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StaffCommissionPolicy" ("calculationMethod", "calculationValue", "carrierId", "createdAt", "endsAt", "id", "isActive", "memo", "name", "startsAt", "updatedAt") SELECT "calculationMethod", "calculationValue", "carrierId", "createdAt", "endsAt", "id", "isActive", "memo", "name", "startsAt", "updatedAt" FROM "StaffCommissionPolicy";
DROP TABLE "StaffCommissionPolicy";
ALTER TABLE "new_StaffCommissionPolicy" RENAME TO "StaffCommissionPolicy";
CREATE INDEX "StaffCommissionPolicy_carrierId_startsAt_endsAt_isActive_idx" ON "StaffCommissionPolicy"("carrierId", "startsAt", "endsAt", "isActive");
CREATE INDEX "StaffCommissionPolicy_staffId_startsAt_endsAt_isActive_idx" ON "StaffCommissionPolicy"("staffId", "startsAt", "endsAt", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
