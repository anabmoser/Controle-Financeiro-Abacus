
# 🛒 Sistema de Controle de Compras para Restaurante

Sistema completo de gestão de compras para restaurante com processamento inteligente de cupons fiscais usando OCR e validação assistida por IA.

## 📋 Funcionalidades

- ✅ **Upload de Cupons Fiscais**: Envie fotos ou PDFs de cupons fiscais
- ✅ **Processamento OCR Inteligente**: Extração automática de dados usando IA
- ✅ **Validação com Chat IA**: Conversa interativa para confirmar e corrigir informações
- ✅ **Gestão de Compras**: Visualize, edite e exclua compras registradas
- ✅ **Sistema de Categorias**: Organize produtos por categorias personalizáveis
- ✅ **Dashboard com Gráficos**: Análise visual de gastos e tendências
- ✅ **Sem Autenticação**: Acesso direto para uso interno

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais básicas. Você precisa apenas adicionar as chaves do Azure OCR (opcional - o sistema usa LLM como fallback):

```env
# Banco de Dados (JÁ CONFIGURADO)
DATABASE_URL='postgresql://...'

# S3 Storage para Uploads (JÁ CONFIGURADO)
AWS_PROFILE=hosted_storage
AWS_REGION=us-west-2
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...

# LLM API para Chat e OCR (JÁ CONFIGURADO)
ABACUSAI_API_KEY=...

# Supabase (JÁ CONFIGURADO)
NEXT_PUBLIC_SUPABASE_URL=https://ixyxegpijupehxykntck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_secret_nGm64xmc7iOLp-d2F47H7A_vVRQe9kN

# Azure OCR (OPCIONAL - O sistema usa LLM como alternativa)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://seu-recurso.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=sua-chave-azure-aqui
```

### 2. Banco de Dados

O banco de dados já foi criado e populado com categorias iniciais:
- ✅ Hortifruti
- ✅ Carnes e Peixes
- ✅ Laticínios
- ✅ Grãos e Cereais
- ✅ Bebidas
- ✅ Temperos e Condimentos
- ✅ Limpeza
- ✅ Descartáveis
- ✅ Outros

### 3. Iniciar Aplicação

```bash
cd nextjs_space
yarn dev
```

A aplicação estará disponível em: `http://localhost:3000`

## 📖 Como Usar

### 1. Fazer Upload de Cupom Fiscal

1. Acesse a página **Upload** no menu
2. Arraste ou selecione um arquivo (JPG, PNG ou PDF)
3. Clique em **Processar Documento**
4. Aguarde o processamento (10-15 segundos)

### 2. Validar com IA

Após o processamento, você será redirecionado para o **Chat de Validação**:

1. A IA apresentará os dados extraídos do cupom
2. Responda às perguntas da IA sobre produtos ambíguos
3. Corrija informações se necessário
4. Quando tudo estiver validado, clique em **Confirmar e Salvar**

**Exemplo de conversa:**

```
🤖 IA: "Olá! Processei seu cupom fiscal do Mercado São João.
      Encontrei 8 itens totalizando R$ 127,50.
      
      Itens identificados:
      1. Tomate - 2kg - R$ 17,00
      2. Cebola - 1kg - R$ 4,20
      3. Arroz - 5kg - R$ 24,90
      ...
      
      Vi 'tomate' no cupom. É tomate italiano, cereja ou comum?"

👤 Você: "É tomate italiano"

🤖 IA: "Entendido! Salvei como 'Tomate Italiano'.
      Mais alguma correção?"

👤 Você: "Não, pode salvar"

🤖 IA: "Perfeito! Posso salvar esta compra no sistema?"

👤 Você: "Sim"
```

### 3. Visualizar Compras

- Acesse **Compras** no menu
- Veja todas as compras registradas
- Use a busca para filtrar por fornecedor
- Clique em 👁️ para ver detalhes
- Clique em 🗑️ para excluir

### 4. Gerenciar Categorias

- Acesse **Categorias** no menu
- Adicione novas categorias com cores personalizadas
- Edite ou exclua categorias existentes

### 5. Dashboard

- Visualize estatísticas de gastos
- Analise gastos por categoria
- Acompanhe evolução temporal
- Filtre por período (7, 30, 90 dias ou 1 ano)

## 🏗️ Estrutura do Projeto

```
nextjs_space/
├── app/
│   ├── dashboard/          # Página principal com estatísticas
│   ├── upload/             # Upload de cupons fiscais
│   ├── chat-validacao/     # Validação com IA
│   ├── compras/            # Listagem de compras
│   ├── categorias/         # Gestão de categorias
│   ├── relatorios/         # Relatórios (em desenvolvimento)
│   └── api/
│       ├── upload/         # API de upload de arquivos
│       ├── ocr/            # API de processamento OCR
│       ├── chat/           # API de chat com IA
│       ├── purchases/      # API CRUD de compras
│       ├── categories/     # API CRUD de categorias
│       └── dashboard/      # API de estatísticas
├── components/
│   ├── layout/             # Layout e navegação
│   ├── ui/                 # Componentes de UI
│   └── charts/             # Gráficos
├── lib/
│   ├── db.ts              # Prisma client
│   ├── s3.ts              # Upload para S3
│   ├── supabase.ts        # Cliente Supabase
│   └── formatters.ts      # Utilitários de formatação
├── prisma/
│   └── schema.prisma      # Schema do banco de dados
└── scripts/
    └── seed.ts            # Script de seed inicial
```

## 🔧 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Storage**: AWS S3
- **OCR**: LLM API (Abacus AI) com suporte para imagens e PDFs
- **Chat IA**: LLM API com streaming
- **Gráficos**: Recharts

## 📊 Modelos de Dados

### Categories (Categorias)
- id, name, color, createdAt

### Products (Produtos)
- id, name, normalizedName, categoryId, unit, brand, description

### Purchases (Compras)
- id, supplierName, supplierCnpj, purchaseDate, totalAmount, paymentMethod, status

### PurchaseItems (Itens de Compra)
- id, purchaseId, productId, productName, quantity, unitPrice, totalPrice

### Receipts (Recibos)
- id, fileUrl, fileName, ocrStatus, ocrResult, purchaseId

## 🔐 Segurança

⚠️ **IMPORTANTE**: Este sistema foi projetado para uso interno privado sem autenticação. 

**Não recomendado para:**
- ❌ Uso público na internet
- ❌ Múltiplos usuários/restaurantes
- ❌ Dados sensíveis de terceiros

**Recomendações de segurança:**
- Use em rede privada/interna
- Configure firewall para bloquear acesso externo
- Faça backups regulares do banco de dados

## 🐛 Solução de Problemas

### Erro no Upload
- Verifique se o arquivo é JPG, PNG ou PDF
- Tamanho máximo: 10MB
- Verifique conexão com AWS S3

### Erro no OCR
- O sistema usa LLM API como alternativa ao Azure
- Verifique se ABACUSAI_API_KEY está configurado
- Para melhor precisão, considere configurar Azure Document Intelligence

### Erro ao Salvar Compra
- Verifique conexão com banco de dados
- Verifique logs do console (F12)
- Certifique-se de que a validação foi concluída

### Página em Branco
- Limpe cache do navegador (Ctrl+Shift+Delete)
- Execute `yarn build && yarn start` para rebuild

## 📝 Roadmap

- [ ] Implementar edição de compras
- [ ] Adicionar relatórios exportáveis (Excel/PDF)
- [ ] Sistema de notificações para itens baixos
- [ ] Integração com fornecedores via API
- [ ] App mobile (React Native)
- [ ] Reconhecimento de produtos por imagem

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Consulte os logs no console (F12 → Console)
3. Verifique arquivo `.env` está configurado corretamente

## 📄 Licença

Este projeto é de uso interno. Todos os direitos reservados.

---

**Desenvolvido em**: Novembro 2025  
**Versão**: 1.0.0  
**Idioma**: Português (Brasil)
