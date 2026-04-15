-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "imei" TEXT NOT NULL,
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
INSERT INTO "new_InventoryItem" ("assigneeId", "capacity", "carrierId", "color", "costAmount", "createdAt", "deviceModelId", "dispatchedAt", "id", "imei", "isHidden", "notes", "receivedAt", "status", "updatedAt") SELECT "assigneeId", "capacity", "carrierId", "color", "costAmount", "createdAt", "deviceModelId", "dispatchedAt", "id", "imei", "isHidden", "notes", "receivedAt", "status", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_imei_key" ON "InventoryItem"("imei");
CREATE INDEX "InventoryItem_storeId_status_idx" ON "InventoryItem"("storeId", "status");
CREATE INDEX "InventoryItem_carrierId_status_idx" ON "InventoryItem"("carrierId", "status");
CREATE INDEX "InventoryItem_deviceModelId_status_idx" ON "InventoryItem"("deviceModelId", "status");
CREATE INDEX "InventoryItem_receivedAt_idx" ON "InventoryItem"("receivedAt");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "storeId" TEXT,
    "staffId" TEXT NOT NULL,
    "canceledById" TEXT,
    "paymentDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "memo" TEXT,
    "canceledAt" DATETIME,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "canceledAt", "canceledById", "cancellationReason", "createdAt", "id", "memo", "method", "paymentDate", "receivableId", "saleId", "staffId", "status", "updatedAt") SELECT "amount", "canceledAt", "canceledById", "cancellationReason", "createdAt", "id", "memo", "method", "paymentDate", "receivableId", "saleId", "staffId", "status", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_receivableId_paymentDate_idx" ON "Payment"("receivableId", "paymentDate");
CREATE INDEX "Payment_storeId_paymentDate_idx" ON "Payment"("storeId", "paymentDate");
CREATE INDEX "Payment_paymentDate_status_idx" ON "Payment"("paymentDate", "status");
CREATE INDEX "Payment_canceledById_idx" ON "Payment"("canceledById");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "storeId" TEXT,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "ratePlanId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "listPrice" INTEGER NOT NULL,
    "discountApplied" BOOLEAN NOT NULL DEFAULT false,
    "discountMethod" TEXT,
    "discountValue" INTEGER,
    "discountSuggestionMethod" TEXT,
    "discountSuggestionValue" INTEGER,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "discountedPrice" INTEGER NOT NULL,
    "subsidyAmount" INTEGER NOT NULL DEFAULT 0,
    "finalSalePrice" INTEGER NOT NULL,
    "cashAmount" INTEGER NOT NULL DEFAULT 0,
    "cardAmount" INTEGER NOT NULL DEFAULT 0,
    "bankTransferAmount" INTEGER NOT NULL DEFAULT 0,
    "cardInstallmentMonths" INTEGER,
    "actualReceivedAmount" INTEGER NOT NULL,
    "receivableAmount" INTEGER NOT NULL DEFAULT 0,
    "deviceCostAmount" INTEGER NOT NULL,
    "rebateAmount" INTEGER NOT NULL DEFAULT 0,
    "policyRevenueAmount" INTEGER NOT NULL DEFAULT 0,
    "profitCalculationBaseAmount" INTEGER,
    "profitDeductionAmount" INTEGER NOT NULL DEFAULT 0,
    "totalProfitAmount" INTEGER NOT NULL DEFAULT 0,
    "appliedRebatePolicyId" TEXT,
    "appliedSaleProfitPolicyId" TEXT,
    "appliedDiscountPolicyId" TEXT,
    "appliedRebatePolicyName" TEXT,
    "appliedSaleProfitPolicyName" TEXT,
    "appliedDiscountPolicyName" TEXT,
    "notes" TEXT,
    "canceledAt" DATETIME,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_appliedDiscountPolicyId_fkey" FOREIGN KEY ("appliedDiscountPolicyId") REFERENCES "DiscountPolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_appliedRebatePolicyId_fkey" FOREIGN KEY ("appliedRebatePolicyId") REFERENCES "RebatePolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_appliedSaleProfitPolicyId_fkey" FOREIGN KEY ("appliedSaleProfitPolicyId") REFERENCES "SaleProfitPolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("actualReceivedAmount", "appliedDiscountPolicyId", "appliedDiscountPolicyName", "appliedRebatePolicyId", "appliedRebatePolicyName", "appliedSaleProfitPolicyId", "appliedSaleProfitPolicyName", "bankTransferAmount", "canceledAt", "cancellationReason", "cardAmount", "cardInstallmentMonths", "carrierId", "cashAmount", "createdAt", "customerId", "deviceCostAmount", "deviceModelId", "discountAmount", "discountApplied", "discountMethod", "discountSuggestionMethod", "discountSuggestionValue", "discountValue", "discountedPrice", "finalSalePrice", "id", "inventoryItemId", "listPrice", "notes", "policyRevenueAmount", "profitCalculationBaseAmount", "profitDeductionAmount", "ratePlanId", "rebateAmount", "receivableAmount", "saleDate", "staffId", "status", "subsidyAmount", "totalProfitAmount", "updatedAt") SELECT "actualReceivedAmount", "appliedDiscountPolicyId", "appliedDiscountPolicyName", "appliedRebatePolicyId", "appliedRebatePolicyName", "appliedSaleProfitPolicyId", "appliedSaleProfitPolicyName", "bankTransferAmount", "canceledAt", "cancellationReason", "cardAmount", "cardInstallmentMonths", "carrierId", "cashAmount", "createdAt", "customerId", "deviceCostAmount", "deviceModelId", "discountAmount", "discountApplied", "discountMethod", "discountSuggestionMethod", "discountSuggestionValue", "discountValue", "discountedPrice", "finalSalePrice", "id", "inventoryItemId", "listPrice", "notes", "policyRevenueAmount", "profitCalculationBaseAmount", "profitDeductionAmount", "ratePlanId", "rebateAmount", "receivableAmount", "saleDate", "staffId", "status", "subsidyAmount", "totalProfitAmount", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_storeId_saleDate_idx" ON "Sale"("storeId", "saleDate");
CREATE INDEX "Sale_saleDate_status_idx" ON "Sale"("saleDate", "status");
CREATE INDEX "Sale_customerId_saleDate_idx" ON "Sale"("customerId", "saleDate");
CREATE INDEX "Sale_inventoryItemId_saleDate_idx" ON "Sale"("inventoryItemId", "saleDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Store_name_key" ON "Store"("name");

-- CreateIndex
CREATE INDEX "Store_isActive_isDefault_idx" ON "Store"("isActive", "isDefault");
