-- CreateTable
CREATE TABLE "ingresos_base" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_recurrente" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "presupuestos_ingresos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ingreso_id" INTEGER NOT NULL,
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
    CONSTRAINT "presupuestos_ingresos_ingreso_id_fkey" FOREIGN KEY ("ingreso_id") REFERENCES "ingresos_base" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bonos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "monto" REAL NOT NULL,
    "descripcion" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "repartos_bonos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bono_id" INTEGER NOT NULL,
    "destino" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "porcentaje" REAL,
    "meses_distribucion" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "repartos_bonos_bono_id_fkey" FOREIGN KEY ("bono_id") REFERENCES "bonos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ingresos_base_nombre_key" ON "ingresos_base"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_ingresos_ingreso_id_anio_key" ON "presupuestos_ingresos"("ingreso_id", "anio");
