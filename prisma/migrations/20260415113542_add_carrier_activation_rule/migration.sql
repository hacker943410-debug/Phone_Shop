-- CreateTable
CREATE TABLE "CarrierActivationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carrierId" TEXT NOT NULL,
    "countUnit" TEXT NOT NULL,
    "countValue" INTEGER NOT NULL,
    "monthCountMode" TEXT,
    "memo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarrierActivationRule_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CarrierActivationRule_carrierId_key" ON "CarrierActivationRule"("carrierId");

-- CreateIndex
CREATE INDEX "CarrierActivationRule_isActive_idx" ON "CarrierActivationRule"("isActive");
