-- CreateTable
CREATE TABLE "utility_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider_key" TEXT NOT NULL,
    "transaction_date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "utility_transactions_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "servicios_basicos" ("nombre") ON DELETE CASCADE ON UPDATE CASCADE
);
