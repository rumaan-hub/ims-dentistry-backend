-- AlterTable: a ledger row may point to a custom product instead of a catalog product
ALTER TABLE "Inventory" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "Inventory" ADD COLUMN "customProductId" UUID;

-- CreateIndex
CREATE INDEX "Inventory_customProductId_idx" ON "Inventory"("customProductId");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_customProductId_fkey"
    FOREIGN KEY ("customProductId") REFERENCES "ims_custom_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
