-- CreateTable
CREATE TABLE "order_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tag_links" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_tag_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_order_tags_name" ON "order_tags"("name");

-- CreateIndex
CREATE INDEX "order_tag_links_tag_id_idx" ON "order_tag_links"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_tag_links_order_id_tag_id_key" ON "order_tag_links"("order_id", "tag_id");

-- AddForeignKey
ALTER TABLE "order_tag_links" ADD CONSTRAINT "order_tag_links_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tag_links" ADD CONSTRAINT "order_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "order_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
