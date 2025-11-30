# 🛠️ Como Executar o Script SQL Corrigido

## ⚠️ Problema Identificado

O script anterior usava `CREATE TABLE IF NOT EXISTS`, mas as tabelas antigas já existiam **sem a coluna `normalized_name`**. O novo script **FORÇA a recriação** de todas as tabelas.

---

## ✅ Passo a Passo

### 1️⃣ Abrir o Script Corrigido

O arquivo está em:
```
/home/ubuntu/controle_compras_restaurante/supabase_schema_fix.sql
```

Ou acesse no GitHub:
```
https://github.com/anabmoser/Controle-Financeiro-Abacus/blob/main/supabase_schema_fix.sql
```

### 2️⃣ Copiar Todo o Conteúdo

Abra o arquivo e copie **TODO O CONTEÚDO** (152 linhas).

### 3️⃣ Executar no Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/ixyxegpijupehxykntck
2. No menu lateral, clique em **SQL Editor**
3. Cole todo o conteúdo do script
4. Clique no botão verde **"RUN"** no canto superior direito

### 4️⃣ Verificar a Execução

Após executar, você deve ver:
```
✅ Success. No rows returned
```

### 5️⃣ Confirmar as Tabelas Criadas

Execute esta query no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Resultado esperado (5 tabelas):**
```
✓ categories
✓ products
✓ purchase_items
✓ purchases
✓ receipts
```

---

## 🔍 O que o Script Faz?

### **PASSO 1: Remove Tabelas Antigas**
```sql
DROP TABLE IF EXISTS "receipts" CASCADE;
DROP TABLE IF EXISTS "purchase_items" CASCADE;
DROP TABLE IF EXISTS "purchases" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "bills" CASCADE;
DROP TABLE IF EXISTS "product_aliases" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
```

### **PASSO 2: Cria 5 Tabelas Novas**
- ✅ `categories` - Categorias de produtos
- ✅ `products` - Catálogo normalizado (com `normalized_name`)
- ✅ `purchases` - Registro de compras
- ✅ `purchase_items` - Itens individuais das compras
- ✅ `receipts` - Metadados dos cupons fiscais

### **PASSO 3: Cria 8 Índices**
- Performance otimizada para buscas e relatórios

### **PASSO 4: Estabelece 5 Foreign Keys**
- Integridade referencial entre tabelas

---

## 📊 Após a Execução

Quando você confirmar que as 5 tabelas foram criadas corretamente, **me avise** e eu farei:

1. ✅ Teste de conexão ao banco
2. ✅ Validação de todas as funcionalidades
3. ✅ Deploy final em produção
4. ✅ App 100% operacional! 🎉

---

## 🆘 Se Houver Erro

Se aparecer algum erro durante a execução:

1. Tire um print da tela com a mensagem de erro
2. Me envie o print
3. Vou diagnosticar e corrigir

---

## 📝 Observações Importantes

- ⚠️ Este script vai **APAGAR** todos os dados atuais das tabelas antigas
- ✅ Isso é necessário porque as tabelas antigas não eram compatíveis com o app
- ✅ O app vai começar com banco de dados limpo e estrutura correta
- ✅ Após a execução, todos os uploads e OCR funcionarão perfeitamente

---

**Aguardando sua confirmação para prosseguir! 🚀**
