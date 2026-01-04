/*
  Warnings:

  - You are about to drop the `mortgage_state` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "mortgage_state";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "mortgage_budget_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anio_proyectado" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL
);
