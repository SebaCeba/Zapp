/*
  Warnings:

  - You are about to drop the column `monto_clp` on the `mortgage_insurance` table. All the data in the column will be lost.
  - Added the required column `monto` to the `mortgage_insurance` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mortgage_insurance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mes_anio" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_mortgage_insurance" ("created_at", "id", "mes_anio") SELECT "created_at", "id", "mes_anio" FROM "mortgage_insurance";
DROP TABLE "mortgage_insurance";
ALTER TABLE "new_mortgage_insurance" RENAME TO "mortgage_insurance";
CREATE UNIQUE INDEX "mortgage_insurance_mes_anio_key" ON "mortgage_insurance"("mes_anio");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
