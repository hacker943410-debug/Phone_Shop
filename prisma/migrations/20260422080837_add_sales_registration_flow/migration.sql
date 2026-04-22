-- CreateTable
CREATE TABLE "SalesAgency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "customerEntryType" TEXT NOT NULL DEFAULT 'EXISTING',
    "activationType" TEXT NOT NULL DEFAULT 'DEVICE_CHANGE',
    "storeId" TEXT,
    "salesAgencyId" TEXT,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "ratePlanId" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "wirelessPostpaidSelected" BOOLEAN NOT NULL DEFAULT false,
    "wirelessPrepaidSelected" BOOLEAN NOT NULL DEFAULT false,
    "wirelessGeneralSelected" BOOLEAN NOT NULL DEFAULT false,
    "wirelessUsimOnlySelected" BOOLEAN NOT NULL DEFAULT false,
    "wirelessUsedPhoneSelected" BOOLEAN NOT NULL DEFAULT false,
    "wirelessEggSelected" BOOLEAN NOT NULL DEFAULT false,
    "wiredInternetSelected" BOOLEAN NOT NULL DEFAULT false,
    "wiredTvSelected" BOOLEAN NOT NULL DEFAULT false,
    "wiredLandlineSelected" BOOLEAN NOT NULL DEFAULT false,
    "wiredInternetPhoneSelected" BOOLEAN NOT NULL DEFAULT false,
    "wiredBundleSelected" BOOLEAN NOT NULL DEFAULT false,
    "additionalDeviceOnlySelected" BOOLEAN NOT NULL DEFAULT false,
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
    "appliedStaffCommissionPolicyId" TEXT,
    "appliedDiscountPolicyId" TEXT,
    "appliedRebatePolicyName" TEXT,
    "appliedSaleProfitPolicyName" TEXT,
    "appliedStaffCommissionPolicyName" TEXT,
    "appliedDiscountPolicyName" TEXT,
    "notes" TEXT,
    "canceledAt" DATETIME,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_appliedDiscountPolicyId_fkey" FOREIGN KEY ("appliedDiscountPolicyId") REFERENCES "DiscountPolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_appliedRebatePolicyId_fkey" FOREIGN KEY ("appliedRebatePolicyId") REFERENCES "RebatePolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_appliedSaleProfitPolicyId_fkey" FOREIGN KEY ("appliedSaleProfitPolicyId") REFERENCES "SaleProfitPolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_appliedStaffCommissionPolicyId_fkey" FOREIGN KEY ("appliedStaffCommissionPolicyId") REFERENCES "StaffCommissionPolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_salesAgencyId_fkey" FOREIGN KEY ("salesAgencyId") REFERENCES "SalesAgency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("actualReceivedAmount", "appliedDiscountPolicyId", "appliedDiscountPolicyName", "appliedRebatePolicyId", "appliedRebatePolicyName", "appliedSaleProfitPolicyId", "appliedSaleProfitPolicyName", "appliedStaffCommissionPolicyId", "appliedStaffCommissionPolicyName", "bankTransferAmount", "canceledAt", "cancellationReason", "cardAmount", "cardInstallmentMonths", "carrierId", "cashAmount", "createdAt", "customerId", "deviceCostAmount", "deviceModelId", "discountAmount", "discountApplied", "discountMethod", "discountSuggestionMethod", "discountSuggestionValue", "discountValue", "discountedPrice", "finalSalePrice", "id", "inventoryItemId", "listPrice", "notes", "policyRevenueAmount", "profitCalculationBaseAmount", "profitDeductionAmount", "ratePlanId", "rebateAmount", "receivableAmount", "saleDate", "staffId", "status", "storeId", "subsidyAmount", "totalProfitAmount", "updatedAt") SELECT "actualReceivedAmount", "appliedDiscountPolicyId", "appliedDiscountPolicyName", "appliedRebatePolicyId", "appliedRebatePolicyName", "appliedSaleProfitPolicyId", "appliedSaleProfitPolicyName", "appliedStaffCommissionPolicyId", "appliedStaffCommissionPolicyName", "bankTransferAmount", "canceledAt", "cancellationReason", "cardAmount", "cardInstallmentMonths", "carrierId", "cashAmount", "createdAt", "customerId", "deviceCostAmount", "deviceModelId", "discountAmount", "discountApplied", "discountMethod", "discountSuggestionMethod", "discountSuggestionValue", "discountValue", "discountedPrice", "finalSalePrice", "id", "inventoryItemId", "listPrice", "notes", "policyRevenueAmount", "profitCalculationBaseAmount", "profitDeductionAmount", "ratePlanId", "rebateAmount", "receivableAmount", "saleDate", "staffId", "status", "storeId", "subsidyAmount", "totalProfitAmount", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_salesAgencyId_saleDate_idx" ON "Sale"("salesAgencyId", "saleDate");
CREATE INDEX "Sale_storeId_saleDate_idx" ON "Sale"("storeId", "saleDate");
CREATE INDEX "Sale_saleDate_status_idx" ON "Sale"("saleDate", "status");
CREATE INDEX "Sale_customerId_saleDate_idx" ON "Sale"("customerId", "saleDate");
CREATE INDEX "Sale_inventoryItemId_saleDate_idx" ON "Sale"("inventoryItemId", "saleDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SalesAgency_name_key" ON "SalesAgency"("name");

-- CreateIndex
CREATE INDEX "SalesAgency_isActive_idx" ON "SalesAgency"("isActive");
