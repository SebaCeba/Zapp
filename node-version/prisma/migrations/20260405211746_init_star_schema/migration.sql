/*
  Warnings:

  - You are about to drop the `actual_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ahorros` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingresos_base` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mortgage_budget_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mortgage_insurance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mortgage_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `obligaciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `presupuestos_ahorros` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `presupuestos_ingresos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `presupuestos_servicios_basicos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `price_overrides` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicios_basicos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supermercado_presupuesto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supuestos_anuales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `utility_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "actual_entries";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ahorros";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "calendar";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ingresos_base";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "mortgage_budget_config";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "mortgage_insurance";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "mortgage_payments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "obligaciones";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "presupuestos_ahorros";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "presupuestos_ingresos";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "presupuestos_servicios_basicos";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "price_overrides";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "servicios_basicos";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "subscriptions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "supermercado_presupuesto";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "supuestos_anuales";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "utility_transactions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "dim_account" (
    "account_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "level" INTEGER NOT NULL,
    "is_base_member" BOOLEAN NOT NULL,
    "account_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "dim_account_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "dim_account" ("account_id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "dim_scenario" (
    "scenario_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scenario_code" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "scenario_type" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "dim_time" (
    "time_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year_month" TEXT NOT NULL,
    "month_name" TEXT,
    "quarter" INTEGER,
    "is_current_month" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fact_financial" (
    "fact_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time_id" INTEGER NOT NULL,
    "scenario_id" INTEGER NOT NULL,
    "account_base_id" INTEGER NOT NULL,
    "amount_clp" INTEGER NOT NULL,
    "is_paid" BOOLEAN,
    "payment_date" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fact_financial_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "dim_time" ("time_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fact_financial_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "dim_scenario" ("scenario_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fact_financial_account_base_id_fkey" FOREIGN KEY ("account_base_id") REFERENCES "dim_account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_rules" (
    "rule_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_id" INTEGER NOT NULL,
    "rule_type" TEXT NOT NULL,
    "rule_config" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "budget_rules_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "dim_account" ("account_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raw_imports" (
    "import_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "raw_data" TEXT,
    "parsed_data" TEXT,
    "account_id" INTEGER,
    "transaction_date" DATETIME,
    "amount" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_imports_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "dim_account" ("account_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assumptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "uf_base_value" REAL NOT NULL,
    "uf_annual_variation" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "budget_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projected_year" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "legacy_account_mapping" (
    "map_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacy_type" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "legacy_category" TEXT,
    "legacy_item_key" TEXT,
    "legacy_name" TEXT,
    "new_account_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_account_account_code_key" ON "dim_account"("account_code");

-- CreateIndex
CREATE INDEX "dim_account_parent_id_idx" ON "dim_account"("parent_id");

-- CreateIndex
CREATE INDEX "dim_account_account_type_idx" ON "dim_account"("account_type");

-- CreateIndex
CREATE INDEX "dim_account_is_base_member_idx" ON "dim_account"("is_base_member");

-- CreateIndex
CREATE UNIQUE INDEX "dim_scenario_scenario_code_key" ON "dim_scenario"("scenario_code");

-- CreateIndex
CREATE UNIQUE INDEX "unique_year_month_str" ON "dim_time"("year_month");

-- CreateIndex
CREATE INDEX "dim_time_year_idx" ON "dim_time"("year");

-- CreateIndex
CREATE INDEX "dim_time_quarter_idx" ON "dim_time"("quarter");

-- CreateIndex
CREATE UNIQUE INDEX "dim_time_year_month_key" ON "dim_time"("year", "month");

-- CreateIndex
CREATE INDEX "fact_financial_time_id_idx" ON "fact_financial"("time_id");

-- CreateIndex
CREATE INDEX "fact_financial_scenario_id_idx" ON "fact_financial"("scenario_id");

-- CreateIndex
CREATE INDEX "fact_financial_account_base_id_idx" ON "fact_financial"("account_base_id");

-- CreateIndex
CREATE INDEX "fact_financial_time_id_scenario_id_idx" ON "fact_financial"("time_id", "scenario_id");

-- CreateIndex
CREATE UNIQUE INDEX "fact_financial_time_id_scenario_id_account_base_id_key" ON "fact_financial"("time_id", "scenario_id", "account_base_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_rules_account_id_rule_type_key" ON "budget_rules"("account_id", "rule_type");

-- CreateIndex
CREATE INDEX "raw_imports_source_status_idx" ON "raw_imports"("source", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assumptions_year_key" ON "assumptions"("year");

-- CreateIndex
CREATE UNIQUE INDEX "budget_config_projected_year_key" ON "budget_config"("projected_year");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_account_mapping_legacy_type_legacy_id_key" ON "legacy_account_mapping"("legacy_type", "legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_account_mapping_legacy_category_legacy_item_key_key" ON "legacy_account_mapping"("legacy_category", "legacy_item_key");
