-- =============================================
-- Script de Configuração do Banco de Dados
-- Controle de Compras - Restaurante
-- =============================================

-- PASSO 1: Remover tabelas antigas (se existirem)
DROP TABLE IF EXISTS "bills" CASCADE;
DROP TABLE IF EXISTS "product_aliases" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;

-- PASSO 2: Criar tabelas corretas para a aplicação

-- CreateTable: categories
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: products
CREATE TABLE IF NOT EXISTS "products" (
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
CREATE TABLE IF NOT EXISTS "purchases" (
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
CREATE TABLE IF NOT EXISTS "purchase_items" (
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
CREATE TABLE IF NOT EXISTS "receipts" (
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

-- PASSO 3: Criar índices para performance

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_normalized_name_idx" ON "products"("normalized_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchases_purchase_date_idx" ON "purchases"("purchase_date" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchases_supplier_name_idx" ON "purchases"("supplier_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_items_product_id_idx" ON "purchase_items"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_items_category_id_idx" ON "purchase_items"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "receipts_purchase_id_key" ON "receipts"("purchase_id");

-- PASSO 4: Adicionar Foreign Keys (relacionamentos entre tabelas)

-- AddForeignKey
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_category_id_fkey";
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT IF EXISTS "purchase_items_purchase_id_fkey";
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT IF EXISTS "purchase_items_product_id_fkey";
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT IF EXISTS "purchase_items_category_id_fkey";
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT IF EXISTS "receipts_purchase_id_fkey";
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- Configuração Completa!
-- =============================================
-- Agora o banco de dados está pronto para a aplicação.
-- Estrutura criada:
--   ✅ 5 Tabelas (categories, products, purchases, purchase_items, receipts)
--   ✅ 8 Índices para performance
--   ✅ 5 Foreign Keys para integridade referencial
-- =============================================