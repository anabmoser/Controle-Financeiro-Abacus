-- =============================================
-- ETAPA 1: LIMPAR TODAS AS TABELAS
-- =============================================
-- Execute APENAS esta etapa primeiro!
-- =============================================

-- Remover TODAS as tabelas (na ordem correta de dependências)
DROP TABLE IF EXISTS "receipts" CASCADE;
DROP TABLE IF EXISTS "purchase_items" CASCADE;
DROP TABLE IF EXISTS "purchases" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "bills" CASCADE;
DROP TABLE IF EXISTS "product_aliases" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;

-- =============================================
-- Limpeza Completa!
-- =============================================
-- Após executar este script com sucesso,
-- execute o script da ETAPA 2
-- =============================================