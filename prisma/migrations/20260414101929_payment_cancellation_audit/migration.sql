-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
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
    CONSTRAINT "Payment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "id", "memo", "method", "paymentDate", "receivableId", "saleId", "staffId", "status", "updatedAt") SELECT "amount", "createdAt", "id", "memo", "method", "paymentDate", "receivableId", "saleId", "staffId", "status", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_receivableId_paymentDate_idx" ON "Payment"("receivableId", "paymentDate");
CREATE INDEX "Payment_paymentDate_status_idx" ON "Payment"("paymentDate", "status");
CREATE INDEX "Payment_canceledById_idx" ON "Payment"("canceledById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
