CREATE TABLE "InventoryColorOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "InventoryColorOption_name_key" ON "InventoryColorOption"("name");
CREATE INDEX "InventoryColorOption_isActive_idx" ON "InventoryColorOption"("isActive");

INSERT INTO "InventoryColorOption" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT
    'inventory-color-' || lower(hex(randomblob(12))),
    trimmed_color,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT TRIM("color") AS trimmed_color
    FROM "InventoryItem"
    WHERE TRIM("color") <> ''
    GROUP BY TRIM("color")
);
