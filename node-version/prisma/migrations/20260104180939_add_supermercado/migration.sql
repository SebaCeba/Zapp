-- CreateTable
CREATE TABLE "supermercado_presupuesto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anio" INTEGER NOT NULL,
    "enero" REAL NOT NULL DEFAULT 0,
    "febrero" REAL NOT NULL DEFAULT 0,
    "marzo" REAL NOT NULL DEFAULT 0,
    "abril" REAL NOT NULL DEFAULT 0,
    "mayo" REAL NOT NULL DEFAULT 0,
    "junio" REAL NOT NULL DEFAULT 0,
    "julio" REAL NOT NULL DEFAULT 0,
    "agosto" REAL NOT NULL DEFAULT 0,
    "septiembre" REAL NOT NULL DEFAULT 0,
    "octubre" REAL NOT NULL DEFAULT 0,
    "noviembre" REAL NOT NULL DEFAULT 0,
    "diciembre" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "supermercado_presupuesto_anio_key" ON "supermercado_presupuesto"("anio");
