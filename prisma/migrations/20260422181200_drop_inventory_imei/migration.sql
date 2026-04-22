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
INSERT INTO "new_InventoryItem" (
    "assigneeId",
    "capacity",
    "carrierId",
    "color",
    "costAmount",
    "createdAt",
    "deviceModelId",
    "dispatchedAt",
    "id",
    "isHidden",
    "modelNumber",
    "notes",
    "receivedAt",
    "serialNumber",
    "status",
    "storeId",
    "updatedAt"
)
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
    "isHidden",
    "modelNumber",
    "notes",
    "receivedAt",
    "serialNumber",
    "status",
    "storeId",
    "updatedAt"
FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_serialNumber_key" ON "InventoryItem"("serialNumber");
CREATE INDEX "InventoryItem_storeId_status_idx" ON "InventoryItem"("storeId", "status");
CREATE INDEX "InventoryItem_carrierId_status_idx" ON "InventoryItem"("carrierId", "status");
CREATE INDEX "InventoryItem_deviceModelId_status_idx" ON "InventoryItem"("deviceModelId", "status");
CREATE INDEX "InventoryItem_receivedAt_idx" ON "InventoryItem"("receivedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
