-- CreateTable
CREATE TABLE "merchant_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "level" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "icon" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "merchant_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "merchant_categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "merchant_mappings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "merchant_name" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "match_pattern" TEXT,
    "confidence" REAL,
    "assigned_by" TEXT NOT NULL DEFAULT 'MANUAL',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "merchant_mappings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "merchant_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tc_billing_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tc_key" TEXT NOT NULL,
    "closing_day" INTEGER NOT NULL DEFAULT 21,
    "due_day" INTEGER NOT NULL DEFAULT 5,
    "business_day_rule" TEXT NOT NULL DEFAULT 'PREVIOUS',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tc_billing_overrides" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tc_key" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "effective_close_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tc_billing_overrides_tc_key_fkey" FOREIGN KEY ("tc_key") REFERENCES "tc_billing_configs" ("tc_key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_mappings_merchant_name_key" ON "merchant_mappings"("merchant_name");

-- CreateIndex
CREATE INDEX "merchant_mappings_category_id_idx" ON "merchant_mappings"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "tc_billing_configs_tc_key_key" ON "tc_billing_configs"("tc_key");

-- CreateIndex
CREATE UNIQUE INDEX "tc_billing_overrides_tc_key_year_month_key" ON "tc_billing_overrides"("tc_key", "year", "month");
