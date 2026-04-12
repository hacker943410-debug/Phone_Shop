-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeviceModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RatePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carrierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyFee" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RatePlan_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AddOnService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carrierId" TEXT,
    "name" TEXT NOT NULL,
    "monthlyFee" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AddOnService_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "InventoryItem_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "birthDate" DATETIME,
    "address" TEXT,
    "memo" TEXT,
    "currentCarrierId" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_currentCarrierId_fkey" FOREIGN KEY ("currentCarrierId") REFERENCES "Carrier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RebatePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "defaultRebateAmount" INTEGER NOT NULL,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RebatePolicy_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RebatePolicy_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleProfitPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "calculationValue" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleProfitPolicy_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscountPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "carrierId" TEXT,
    "deviceModelId" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "discountMethod" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiscountPolicy_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DiscountPolicy_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
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
    CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleAddOnService" (
    "saleId" TEXT NOT NULL,
    "addOnServiceId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "monthlyFee" INTEGER,

    PRIMARY KEY ("saleId", "addOnServiceId"),
    CONSTRAINT "SaleAddOnService_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleAddOnService_addOnServiceId_fkey" FOREIGN KEY ("addOnServiceId") REFERENCES "AddOnService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "originalAmount" INTEGER NOT NULL,
    "balanceAmount" INTEGER NOT NULL,
    "memo" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Receivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_code_key" ON "Carrier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_name_key" ON "Carrier"("name");

-- CreateIndex
CREATE INDEX "Carrier_isActive_idx" ON "Carrier"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModel_name_key" ON "DeviceModel"("name");

-- CreateIndex
CREATE INDEX "DeviceModel_isActive_idx" ON "DeviceModel"("isActive");

-- CreateIndex
CREATE INDEX "RatePlan_carrierId_isActive_idx" ON "RatePlan"("carrierId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RatePlan_carrierId_name_key" ON "RatePlan"("carrierId", "name");

-- CreateIndex
CREATE INDEX "AddOnService_isActive_idx" ON "AddOnService"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AddOnService_carrierId_name_key" ON "AddOnService"("carrierId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_imei_key" ON "InventoryItem"("imei");

-- CreateIndex
CREATE INDEX "InventoryItem_carrierId_status_idx" ON "InventoryItem"("carrierId", "status");

-- CreateIndex
CREATE INDEX "InventoryItem_deviceModelId_status_idx" ON "InventoryItem"("deviceModelId", "status");

-- CreateIndex
CREATE INDEX "InventoryItem_receivedAt_idx" ON "InventoryItem"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_normalizedPhone_key" ON "Customer"("normalizedPhone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_isHidden_idx" ON "Customer"("isHidden");

-- CreateIndex
CREATE INDEX "RebatePolicy_carrierId_deviceModelId_startsAt_endsAt_isActive_idx" ON "RebatePolicy"("carrierId", "deviceModelId", "startsAt", "endsAt", "isActive");

-- CreateIndex
CREATE INDEX "SaleProfitPolicy_carrierId_startsAt_endsAt_isActive_idx" ON "SaleProfitPolicy"("carrierId", "startsAt", "endsAt", "isActive");

-- CreateIndex
CREATE INDEX "DiscountPolicy_target_startsAt_endsAt_isActive_idx" ON "DiscountPolicy"("target", "startsAt", "endsAt", "isActive");

-- CreateIndex
CREATE INDEX "DiscountPolicy_carrierId_isActive_idx" ON "DiscountPolicy"("carrierId", "isActive");

-- CreateIndex
CREATE INDEX "DiscountPolicy_deviceModelId_isActive_idx" ON "DiscountPolicy"("deviceModelId", "isActive");

-- CreateIndex
CREATE INDEX "Sale_saleDate_status_idx" ON "Sale"("saleDate", "status");

-- CreateIndex
CREATE INDEX "Sale_customerId_saleDate_idx" ON "Sale"("customerId", "saleDate");

-- CreateIndex
CREATE INDEX "Sale_inventoryItemId_saleDate_idx" ON "Sale"("inventoryItemId", "saleDate");

-- CreateIndex
CREATE UNIQUE INDEX "Receivable_saleId_key" ON "Receivable"("saleId");

-- CreateIndex
CREATE INDEX "Receivable_customerId_status_idx" ON "Receivable"("customerId", "status");

-- CreateIndex
CREATE INDEX "Receivable_balanceAmount_idx" ON "Receivable"("balanceAmount");

-- CreateIndex
CREATE INDEX "Payment_receivableId_paymentDate_idx" ON "Payment"("receivableId", "paymentDate");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_status_idx" ON "Payment"("paymentDate", "status");
