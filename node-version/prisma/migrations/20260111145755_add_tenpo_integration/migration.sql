-- CreateTable
CREATE TABLE "google_auth_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "scope" TEXT NOT NULL,
    "token_type" TEXT NOT NULL DEFAULT 'Bearer',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tenpo_emails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gmail_message_id" TEXT NOT NULL,
    "label_type" TEXT NOT NULL,
    "raw_body" TEXT NOT NULL,
    "email_date" DATETIME NOT NULL,
    "parsed_ok" BOOLEAN NOT NULL DEFAULT false,
    "parse_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tenpo_purchases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_id" INTEGER NOT NULL,
    "purchase_date" DATETIME NOT NULL,
    "merchant" TEXT NOT NULL,
    "amount_total_clp" REAL NOT NULL,
    "installments_count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenpo_purchases_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "tenpo_emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenpo_installments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchase_id" INTEGER NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "base_amount_clp" REAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "pay_date_estimated" DATETIME NOT NULL,
    "override_interest_rate" REAL,
    "override_monthly_amount_clp" REAL,
    "final_monthly_amount_clp" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenpo_installments_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "tenpo_purchases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenpo_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_id" INTEGER NOT NULL,
    "pay_date" DATETIME NOT NULL,
    "amount_clp" REAL NOT NULL,
    "payment_method" TEXT NOT NULL,
    "transaction_code" TEXT NOT NULL,
    "period_pay" TEXT,
    "period_bill" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenpo_payments_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "tenpo_emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenpo_emails_gmail_message_id_key" ON "tenpo_emails"("gmail_message_id");
