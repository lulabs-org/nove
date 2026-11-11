-- AlterTable
ALTER TABLE "orders" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "idx_orders_tags" ON "orders"("tags");
