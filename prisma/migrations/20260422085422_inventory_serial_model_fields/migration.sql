/*
  Warnings:

  - Added the required column `modelNumber` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serialNumber` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT,
    "carrierId" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "capacity" TEXT NOT NULL,
    "imei" TEXT,
    "serialNumber" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "costAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "dispatchedAt" DATETIME,
    "notes" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("assigneeId", "capacity", "carrierId", "color", "costAmount", "createdAt", "deviceModelId", "dispatchedAt", "id", "imei", "isHidden", "modelNumber", "notes", "receivedAt", "serialNumber", "status", "storeId", "updatedAt")
SELECT
  "assigneeId",
  "capacity",
  "carrierId",
  "color",
  "costAmount",
  "createdAt",
  "deviceModelId",
  "dispatchedAt",
  "id",
  "imei",
  "isHidden",
  COALESCE(
    (SELECT "name" FROM "DeviceModel" WHERE "DeviceModel"."id" = "InventoryItem"."deviceModelId"),
    "capacity"
  ) AS "modelNumber",
  "notes",
  "receivedAt",
  COALESCE("imei", 'LEGACY-' || substr("id", 1, 8)) AS "serialNumber",
  "status",
  "storeId",
  "updatedAt"
FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_imei_key" ON "InventoryItem"("imei");
CREATE UNIQUE INDEX "InventoryItem_serialNumber_key" ON "InventoryItem"("serialNumber");
CREATE INDEX "InventoryItem_storeId_status_idx" ON "InventoryItem"("storeId", "status");
CREATE INDEX "InventoryItem_carrierId_status_idx" ON "InventoryItem"("carrierId", "status");
CREATE INDEX "InventoryItem_deviceModelId_status_idx" ON "InventoryItem"("deviceModelId", "status");
CREATE INDEX "InventoryItem_receivedAt_idx" ON "InventoryItem"("receivedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
