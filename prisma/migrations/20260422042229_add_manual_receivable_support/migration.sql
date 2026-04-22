-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "saleId" TEXT,
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
    CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "canceledAt", "canceledById", "cancellationReason", "createdAt", "id", "memo", "method", "paymentDate", "receivableId", "saleId", "staffId", "status", "storeId", "updatedAt") SELECT "amount", "canceledAt", "canceledById", "cancellationReason", "createdAt", "id", "memo", "method", "paymentDate", "receivableId", "saleId", "staffId", "status", "storeId", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_receivableId_paymentDate_idx" ON "Payment"("receivableId", "paymentDate");
CREATE INDEX "Payment_storeId_paymentDate_idx" ON "Payment"("storeId", "paymentDate");
CREATE INDEX "Payment_paymentDate_status_idx" ON "Payment"("paymentDate", "status");
CREATE INDEX "Payment_canceledById_idx" ON "Payment"("canceledById");
CREATE TABLE "new_Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "originalAmount" INTEGER NOT NULL,
    "balanceAmount" INTEGER NOT NULL,
    "memo" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Receivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receivable" ("balanceAmount", "closedAt", "createdAt", "customerId", "id", "memo", "originalAmount", "saleId", "status", "updatedAt") SELECT "balanceAmount", "closedAt", "createdAt", "customerId", "id", "memo", "originalAmount", "saleId", "status", "updatedAt" FROM "Receivable";
DROP TABLE "Receivable";
ALTER TABLE "new_Receivable" RENAME TO "Receivable";
CREATE UNIQUE INDEX "Receivable_saleId_key" ON "Receivable"("saleId");
CREATE INDEX "Receivable_customerId_status_idx" ON "Receivable"("customerId", "status");
CREATE INDEX "Receivable_balanceAmount_idx" ON "Receivable"("balanceAmount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
