# 🍽️ Controle Financeiro - Sistema de Gestão de Compras para Restaurante

![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.7-brightgreen)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Status](https://img.shields.io/badge/Status-Production-success)

Sistema completo de gestão financeira para restaurantes com OCR automático de notas fiscais, análise de gastos por período e categoria, e relatórios detalhados.

---

## 🚀 Demo

**Aplicação em Produção:** [https://controle-compras-res-d7yzxl.abacusai.app](https://controle-compras-res-d7yzxl.abacusai.app)

---

## ✨ Funcionalidades

### 📸 Upload e OCR Inteligente
- Upload de notas fiscais (imagem ou PDF)
- OCR automático com GPT-4o (anti-alucinação)
- Extração de:
  - Fornecedor e CNPJ
  - Data e valor total
  - Lista completa de produtos
  - Quantidades e preços unitários
- Chat de validação para correção de dados

### 📊 Dashboard Analítico
- Visão geral de gastos
- Gráficos de evolução temporal
- Análise por categoria
- Comparação de períodos:
  - Este mês / Mês passado
  - Últimos 7 dias
  - Período customizado (calendário)

### 🛒 Histórico de Compras
- Lista de todas as compras
- Expansão para ver produtos detalhados
- Filtros por período
- Visualização de fornecedores

### 📦 Gestão de Produtos
- Busca inteligente com autocomplete
- Histórico de preços por produto
- Comparação de preços entre compras
- Sugestões de produtos mais comprados
- Busca por códigos ou nomes parciais

### 🏷️ Categorias
- Organização por tipo de produto
- Análise de gastos por categoria
- Modal detalhado com:
  - Total gasto
  - Quantidade de itens
  - Lista de produtos
  - Compras recentes

### 📈 Relatórios
- Resumo financeiro por período
- Top 10 produtos mais comprados
- Análise de fornecedores
- Exportação de dados

---

## 🛠️ Tecnologias

### Frontend
- **Next.js 14.2** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos interativos
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Backend
- **Next.js API Routes** - 17 endpoints RESTful
- **Prisma ORM** - Banco de dados
- **Supabase (PostgreSQL)** - Database hosting
- **AWS S3** - Armazenamento de arquivos
- **GPT-4o** - OCR e validação

### Infraestrutura
- **Vercel/Abacus.AI** - Hosting
- **GitHub** - Versionamento
- **SSL/HTTPS** - Segurança

---

## 📁 Estrutura do Projeto

```
controle_compras_restaurante/
├── nextjs_space/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── categories/         # Gerenciamento de categorias
│   │   │   ├── chat/               # Chat de validação
│   │   │   ├── dashboard/          # Estatísticas do dashboard
│   │   │   ├── ocr/                # Processamento OCR
│   │   │   ├── products/           # Histórico e busca de produtos
│   │   │   ├── purchases/          # Gerenciamento de compras
│   │   │   ├── reports/            # Relatórios
│   │   │   └── upload/             # Upload de arquivos
│   │   ├── categorias/             # Página de categorias
│   │   ├── chat-validacao/         # Chat de validação
│   │   ├── compras/                # Histórico de compras
│   │   ├── dashboard/              # Dashboard principal
│   │   ├── produtos/               # Histórico de produtos
│   │   ├── relatorios/             # Relatórios
│   │   ├── upload/                 # Upload de notas
│   │   ├── layout.tsx              # Layout principal
│   │   └── page.tsx                # Home page
│   ├── components/
│   │   ├── charts/                 # Gráficos
│   │   ├── layout/                 # Componentes de layout
│   │   └── ui/                     # Componentes shadcn/ui
│   ├── lib/
│   │   ├── aws-config.ts           # Configuração AWS S3
│   │   ├── db.ts                   # Cliente Prisma
│   │   ├── s3.ts                   # Funções S3
│   │   ├── supabase.ts             # Cliente Supabase
│   │   ├── types.ts                # Tipos TypeScript
│   │   └── utils.ts                # Utilitários
│   ├── prisma/
│   │   └── schema.prisma           # Schema do banco de dados
│   ├── public/                     # Assets estáticos
│   ├── .env.example                # Template de variáveis de ambiente
│   ├── package.json                # Dependências
│   ├── next.config.js              # Configuração Next.js
│   ├── tailwind.config.ts          # Configuração Tailwind
│   └── tsconfig.json               # Configuração TypeScript
└── README.md
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ 
- Yarn ou npm
- Conta no Supabase
- Conta no AWS (para S3) ou Abacus.AI (storage incluído)
- API Key da Abacus.AI (para OCR)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/anabmoser/Controle-Financeiro-Abacus.git
cd Controle-Financeiro-Abacus/nextjs_space
```

### Passo 2: Instalar Dependências

```bash
yarn install
# ou
npm install
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"

# AWS S3 (ou use Abacus.AI Cloud Storage)
AWS_PROFILE="default"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="seu-bucket"
AWS_FOLDER_PREFIX="uploads/"

# Abacus.AI API (para OCR)
ABACUSAI_API_KEY="sua-api-key"

# Azure (opcional, se usar Azure Document Intelligence)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=""
AZURE_DOCUMENT_INTELLIGENCE_KEY=""
```

### Passo 4: Configurar Banco de Dados

```bash
# Gerar cliente Prisma
yarn prisma generate

# Criar tabelas no banco
yarn prisma db push

# (Opcional) Popular com dados de exemplo
yarn prisma db seed
```

### Passo 5: Executar em Desenvolvimento

```bash
yarn dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

**receipts** - Notas fiscais uploadadas
- `id`, `fileName`, `fileUrl`, `fileSize`, `fileType`
- `ocrStatus`, `ocrError`, `createdAt`, `updatedAt`

**purchases** - Compras processadas
- `id`, `receiptId`, `fornecedor`, `cnpj`, `data`, `total`
- `createdAt`, `updatedAt`

**purchaseItems** - Itens de cada compra
- `id`, `purchaseId`, `productId`, `productName`
- `quantity`, `unitPrice`, `totalPrice`, `categoryId`

**products** - Produtos únicos
- `id`, `name`, `createdAt`, `updatedAt`

**categories** - Categorias de produtos
- `id`, `name`, `createdAt`, `updatedAt`

---

## 📝 API Endpoints

### Upload e OCR
- `POST /api/upload` - Upload de nota fiscal
- `POST /api/ocr/process` - Processar OCR
- `GET /api/ocr/result` - Resultado do OCR

### Compras
- `GET /api/purchases` - Listar compras
- `GET /api/purchases/[id]` - Detalhes de uma compra
- `POST /api/purchases/save` - Salvar compra validada
- `GET /api/purchases/by-period` - Compras por período

### Produtos
- `GET /api/products/history` - Histórico de produtos
- `GET /api/products/search` - Buscar produtos (autocomplete)

### Categorias
- `GET /api/categories` - Listar categorias
- `GET /api/categories/[id]` - Detalhes de uma categoria
- `GET /api/categories/[id]/details` - Análise detalhada por período

### Dashboard e Relatórios
- `GET /api/dashboard/stats` - Estatísticas do dashboard
- `GET /api/reports/summary` - Resumo de relatórios

### Chat de Validação
- `POST /api/chat/validate` - Validar dados com chat

---

## 🎨 Recursos de UI/UX

### Design System
- ✅ Dark mode / Light mode
- ✅ Design responsivo (mobile-first)
- ✅ Animações suaves (Framer Motion)
- ✅ Feedback visual para todas as ações
- ✅ Loading states e skeletons
- ✅ Tratamento de erros com mensagens claras

### Componentes Principais
- Cards interativos com hover effects
- Tabelas com expansão de linhas
- Modals para detalhes
- Gráficos interativos (Line, Pie)
- Seletor de período com calendário
- Autocomplete inteligente
- Toast notifications

---

## 🔒 Segurança

- ✅ Variáveis de ambiente protegidas
- ✅ API Keys não expostas no frontend
- ✅ SSL/HTTPS em produção
- ✅ Validação de inputs (Zod)
- ✅ Sanitização de dados
- ✅ Upload com validação de tipo/tamanho

---

## 🚀 Deploy

### Opção 1: Abacus.AI (Atual)

O projeto já está deployado em:
- **URL:** https://controle-compras-res-d7yzxl.abacusai.app
- **Redeploy:** Automático via DeepAgent

### Opção 2: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd nextjs_space
vercel
```

### Opção 3: Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Opção 4: Docker

```bash
# Build
docker build -t controle-financeiro .

# Run
docker run -p 3000:3000 controle-financeiro
```

---

## 📊 Performance

### Métricas de Build
- **First Load JS:** ~87.6 kB (shared)
- **Páginas estáticas:** 12/12
- **API Routes:** 17 endpoints
- **Build time:** ~30 segundos

### Otimizações
- Code splitting automático
- Lazy loading de componentes
- Image optimization (Next.js Image)
- API response caching
- Database query optimization

---

## 🐛 Troubleshooting

### Erro: "Prisma Client não encontrado"
```bash
yarn prisma generate
```

### Erro: "Database connection failed"
- Verifique se o `DATABASE_URL` está correto no `.env`
- Teste a conexão com o Supabase

### Erro: "OCR não está funcionando"
- Verifique se `ABACUSAI_API_KEY` está configurada
- Verifique se a API key tem créditos

### Build falhou
```bash
# Limpar cache
rm -rf .next node_modules
yarn install
yarn build
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é privado e proprietário.

---

## 👤 Autor

**Ana Moser**
- GitHub: [@anabmoser](https://github.com/anabmoser)
- Email: [seu-email@example.com]

---

## 🙏 Agradecimentos

- **Abacus.AI** - Plataforma de deploy e APIs de LLM
- **Supabase** - Database hosting
- **Vercel** - Next.js framework
- **shadcn/ui** - Componentes UI

---

## 📮 Suporte

Se você encontrar algum problema ou tiver sugestões:
1. Abra uma issue no GitHub
2. Entre em contato via email
3. Consulte a documentação completa

---

**Desenvolvido com ❤️ usando Next.js e TypeScript**
