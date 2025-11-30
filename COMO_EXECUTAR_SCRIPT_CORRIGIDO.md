# 🛑️ Como Executar o Script SQL em 2 Etapas

## ⚠️ Por Que 2 Etapas?

O script anterior falhava porque tentava criar constraints em tabelas que ainda não tinham sido completamente recriadas. Para evitar isso, vamos executar em **2 etapas separadas**:

1. **ETAPA 1**: Limpar todas as tabelas antigas
2. **ETAPA 2**: Criar as tabelas novas corretas

---

# 🟦 ETAPA 1: Limpar Tudo

## 1️⃣ Abrir o Arquivo

```
ETAPA_1_LIMPAR_TUDO.sql
```

## 2️⃣ Copiar o Conteúdo

```sql
-- =============================================
-- ETAPA 1: LIMPAR TODAS AS TABELAS
-- =============================================

DROP TABLE IF EXISTS "receipts" CASCADE;
DROP TABLE IF EXISTS "purchase_items" CASCADE;
DROP TABLE IF EXISTS "purchases" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "bills" CASCADE;
DROP TABLE IF EXISTS "product_aliases" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
```

## 3️⃣ Executar no Supabase

1. Acesse: https://supabase.com/dashboard/project/ixyxegpijupehxykntck
2. Clique em **SQL Editor**
3. Cole o script da ETAPA 1
4. Clique em **RUN** (botão verde)
5. Aguarde a mensagem: **✅ Success. No rows returned**

---

# 🟩 ETAPA 2: Criar Tabelas Novas

## ⚠️ **IMPORTANTE: Só execute após a ETAPA 1 ter sido concluída com sucesso!**

## 1️⃣ Abrir o Arquivo

```
ETAPA_2_CRIAR_TABELAS.sql
```

## 2️⃣ Copiar TODO o Conteúdo

Este arquivo é maior (152 linhas). Copie **TODO O CONTEÚDO** do arquivo.

## 3️⃣ Executar no Supabase

1. No mesmo **SQL Editor**
2. **Limpe o editor** (delete o script da ETAPA 1)
3. Cole o script da ETAPA 2
4. Clique em **RUN** (botão verde)
5. Aguarde a mensagem: **✅ Success. No rows returned**

---

# 🔍 Verificar Sucesso

Após executar as 2 etapas, confirme que tudo funcionou:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Resultado esperado (5 tabelas):**
```
✅ categories
✅ products
✅ purchase_items
✅ purchases
✅ receipts
```

---

# ✅ Próximos Passos

Quando você confirmar que as 5 tabelas foram criadas:

1. ✅ Me avise
2. ✅ Farei o teste de conexão
3. ✅ Validarei todas as funcionalidades
4. ✅ Deploy final em produção
5. ✅ App 100% operacional! 🎉

---

# 🆘 Se Houver Erro

Se qualquer uma das etapas falhar:

1. Tire um print da tela
2. Me envie o print
3. Vou diagnosticar e corrigir

---

**Aguardando sua confirmação! 🚀**
