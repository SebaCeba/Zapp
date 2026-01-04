-- CreateTable
CREATE TABLE "calendar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "periodicity" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "start_date_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_start_date_id_fkey" FOREIGN KEY ("start_date_id") REFERENCES "calendar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "price_overrides" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscription_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "price_overrides_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_date_key" ON "calendar"("date");

-- CreateIndex
CREATE UNIQUE INDEX "price_overrides_subscription_id_year_month_key" ON "price_overrides"("subscription_id", "year", "month");
