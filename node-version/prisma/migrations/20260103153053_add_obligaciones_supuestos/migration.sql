-- CreateTable
CREATE TABLE "obligaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "monto_cuota" REAL NOT NULL,
    "cuotas_totales" INTEGER NOT NULL,
    "mes_inicio" INTEGER NOT NULL,
    "anio_inicio" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "supuestos_anuales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anio" INTEGER NOT NULL,
    "valor_uf_base" REAL NOT NULL,
    "variacion_anual_uf" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "supuestos_anuales_anio_key" ON "supuestos_anuales"("anio");
