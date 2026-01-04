/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `servicios_basicos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "servicios_basicos_nombre_key" ON "servicios_basicos"("nombre");
