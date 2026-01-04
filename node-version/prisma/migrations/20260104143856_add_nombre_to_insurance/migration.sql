/*
  Warnings:

  - Added the required column `nombre` to the `mortgage_insurance` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mortgage_insurance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "mes_anio" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_mortgage_insurance" ("created_at", "id", "mes_anio", "moneda", "monto", "nombre") SELECT "created_at", "id", "mes_anio", "moneda", "monto", 'Seguro General' FROM "mortgage_insurance";
DROP TABLE "mortgage_insurance";
ALTER TABLE "new_mortgage_insurance" RENAME TO "mortgage_insurance";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
