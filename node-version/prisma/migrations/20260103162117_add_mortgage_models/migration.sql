-- CreateTable
CREATE TABLE "mortgage_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "num_div" INTEGER NOT NULL,
    "amortizacion_uf" REAL NOT NULL,
    "interes_uf" REAL NOT NULL,
    "com_d_in" REAL NOT NULL,
    "total_div_uf" REAL NOT NULL,
    "fecha_vencimiento" DATETIME NOT NULL,
    "saldo_insoluto_uf" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "mortgage_state" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ultima_cuota_pagada" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mortgage_insurance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mes_anio" TEXT NOT NULL,
    "monto_clp" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_insurance_mes_anio_key" ON "mortgage_insurance"("mes_anio");
