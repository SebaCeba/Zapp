-- CreateTable
CREATE TABLE "ahorros" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "presupuestos_ahorros" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ahorro_id" INTEGER NOT NULL,
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
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "presupuestos_ahorros_ahorro_id_fkey" FOREIGN KEY ("ahorro_id") REFERENCES "ahorros" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ahorros_nombre_key" ON "ahorros"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_ahorros_ahorro_id_anio_key" ON "presupuestos_ahorros"("ahorro_id", "anio");
