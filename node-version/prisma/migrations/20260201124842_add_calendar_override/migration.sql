-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tenpo_purchases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_id" INTEGER NOT NULL,
    "purchase_date" DATETIME NOT NULL,
    "merchant" TEXT NOT NULL,
    "amount_total_clp" REAL NOT NULL,
    "installments_count" INTEGER NOT NULL,
    "tiene_interes" BOOLEAN NOT NULL DEFAULT true,
    "modo_monto" TEXT NOT NULL DEFAULT 'ESTIMADO',
    "total_financiado_estimado" REAL,
    "interes_total_estimado" REAL,
    "metadata" TEXT,
    "schedule_mode" TEXT NOT NULL DEFAULT 'AUTO',
    "first_due_date_override" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenpo_purchases_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "tenpo_emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tenpo_purchases" ("amount_total_clp", "created_at", "email_id", "id", "installments_count", "interes_total_estimado", "merchant", "metadata", "modo_monto", "purchase_date", "tiene_interes", "total_financiado_estimado", "updated_at") SELECT "amount_total_clp", "created_at", "email_id", "id", "installments_count", "interes_total_estimado", "merchant", "metadata", "modo_monto", "purchase_date", "tiene_interes", "total_financiado_estimado", "updated_at" FROM "tenpo_purchases";
DROP TABLE "tenpo_purchases";
ALTER TABLE "new_tenpo_purchases" RENAME TO "tenpo_purchases";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
