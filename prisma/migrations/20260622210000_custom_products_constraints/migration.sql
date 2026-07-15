-- Custom products carry a real Consumable/Equipment type (drives low-stock/near-expiry)
ALTER TABLE "ims_custom_products" ADD COLUMN "inventory_type" "ProductInventoryType" NOT NULL DEFAULT 'CONSUMABLE';

-- No duplicate custom-product names per clinic
CREATE UNIQUE INDEX "ims_custom_products_client_id_name_key" ON "ims_custom_products"("client_id", "name");

-- FK XOR: a ledger row points to EXACTLY ONE source — catalog product OR custom product, never both/neither
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_item_source_xor" CHECK (
    ("customProductId" IS NOT NULL AND "productId" IS NULL)
    OR ("productId" IS NOT NULL AND "customProductId" IS NULL)
);
