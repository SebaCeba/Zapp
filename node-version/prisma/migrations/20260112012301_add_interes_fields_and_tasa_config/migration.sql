-- CreateTable
CREATE TABLE "tenpo_tasa_cuotas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tasa_mensual" REAL NOT NULL,
    "cae" TEXT,
    "vigente_desde" DATETIME NOT NULL,
    "vigente_hasta" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tenpo_installments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchase_id" INTEGER NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "base_amount_clp" REAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "pay_date_estimated" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ESTIMADO',
    "override_interest_rate" REAL,
    "override_monthly_amount_clp" REAL,
    "final_monthly_amount_clp" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenpo_installments_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "tenpo_purchases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tenpo_installments" ("base_amount_clp", "created_at", "due_date", "final_monthly_amount_clp", "id", "installment_number", "override_interest_rate", "override_monthly_amount_clp", "pay_date_estimated", "purchase_id", "updated_at") SELECT "base_amount_clp", "created_at", "due_date", "final_monthly_amount_clp", "id", "installment_number", "override_interest_rate", "override_monthly_amount_clp", "pay_date_estimated", "purchase_id", "updated_at" FROM "tenpo_installments";
DROP TABLE "tenpo_installments";
ALTER TABLE "new_tenpo_installments" RENAME TO "tenpo_installments";
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenpo_purchases_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "tenpo_emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tenpo_purchases" ("amount_total_clp", "created_at", "email_id", "id", "installments_count", "merchant", "purchase_date") SELECT "amount_total_clp", "created_at", "email_id", "id", "installments_count", "merchant", "purchase_date" FROM "tenpo_purchases";
DROP TABLE "tenpo_purchases";
ALTER TABLE "new_tenpo_purchases" RENAME TO "tenpo_purchases";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
