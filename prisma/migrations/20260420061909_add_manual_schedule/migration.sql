-- CreateTable
CREATE TABLE "ManualSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "customerId" TEXT,
    "saleId" TEXT,
    "memo" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManualSchedule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManualSchedule_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ManualSchedule_scheduledDate_status_idx" ON "ManualSchedule"("scheduledDate", "status");

-- CreateIndex
CREATE INDEX "ManualSchedule_customerId_scheduledDate_idx" ON "ManualSchedule"("customerId", "scheduledDate");

-- CreateIndex
CREATE INDEX "ManualSchedule_createdById_scheduledDate_idx" ON "ManualSchedule"("createdById", "scheduledDate");
