-- CreateTable: tenant-owned custom products (flexible JSON-blob design)
CREATE TABLE "ims_custom_products" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ims_custom_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ims_custom_products_client_id_idx" ON "ims_custom_products"("client_id");

-- AddForeignKey
ALTER TABLE "ims_custom_products" ADD CONSTRAINT "ims_custom_products_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "ImsUser"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
