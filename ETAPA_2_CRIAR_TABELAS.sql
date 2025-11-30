-- =============================================
-- ETAPA 2: CRIAR TODAS AS TABELAS NOVAS
-- =============================================
-- Execute APENAS após a ETAPA 1 ter sido concluída!
-- =============================================

-- CreateTable: categories
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "category_id" TEXT,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'un',
    "brand" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: purchases
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplier_name" TEXT NOT NULL,
    "supplier_cnpj" VARCHAR(18),
    "purchase_date" TIMESTAMPTZ(6) NOT NULL,
    "invoice_number" VARCHAR(100),
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT,
    "receipt_url" TEXT,
    "receipt_file_name" TEXT,
    "processed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ocr_confidence" DECIMAL(3,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable: purchase_items
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchase_id" TEXT NOT NULL,
    "product_id" TEXT,
    "category_id" TEXT,
    "product_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'un',
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: receipts
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" BIGINT,
    "file_type" VARCHAR(50),
    "ocr_status" TEXT NOT NULL DEFAULT 'pending',
    "ocr_result" JSONB,
    "processed_at" TIMESTAMPTZ(6),
    "purchase_id" TEXT,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "products_normalized_name_idx" ON "products"("normalized_name");

-- CreateIndex
CREATE INDEX "purchases_purchase_date_idx" ON "purchases"("purchase_date" DESC);

-- CreateIndex
CREATE INDEX "purchases_supplier_name_idx" ON "purchases"("supplier_name");

-- CreateIndex
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items"("product_id");

-- CreateIndex
CREATE INDEX "purchase_items_category_id_idx" ON "purchase_items"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_purchase_id_key" ON "receipts"("purchase_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- Configuração Completa!
-- =============================================
-- Estrutura criada:
--   ✅ 5 Tabelas (categories, products, purchases, purchase_items, receipts)
--   ✅ 8 Índices para performance
--   ✅ 5 Foreign Keys para integridade referencial
-- =============================================