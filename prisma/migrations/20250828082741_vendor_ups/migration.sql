/*
  Warnings:

  - A unique constraint covering the columns `[vendorId]` on the table `VendorUPS` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VendorUPS_vendorId_key" ON "VendorUPS"("vendorId");
