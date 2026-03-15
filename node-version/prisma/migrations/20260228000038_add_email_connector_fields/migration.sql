-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_servicios_basicos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_base" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "gmail_label" TEXT,
    "has_email_connector" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_servicios_basicos" ("activo", "created_at", "es_base", "id", "nombre", "orden", "updated_at") SELECT "activo", "created_at", "es_base", "id", "nombre", "orden", "updated_at" FROM "servicios_basicos";
DROP TABLE "servicios_basicos";
ALTER TABLE "new_servicios_basicos" RENAME TO "servicios_basicos";
CREATE UNIQUE INDEX "servicios_basicos_nombre_key" ON "servicios_basicos"("nombre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
