# Migração para Vercel + Supabase

## Resumo das Mudanças

### 1. Storage: AWS S3 → Supabase Storage
- **Removidos**: `lib/s3.ts`, `lib/aws-config.ts`, dependências `@aws-sdk/*`
- **Criado**: `lib/storage.ts` usando Supabase Storage (bucket `receipts`, PRIVADO)
- Função `sanitizeKey()` determinística: `normalize('NFD') → remove diacríticos → troca [^A-Za-z0-9._/-] por _`
- Função `legacyPathToStoragePath()` converte caminhos legados do banco (remove prefixo `11526/` + sanitizeKey)
- O banco de dados NÃO precisa ser alterado — a conversão é feita em runtime
- Novos uploads já gravam caminho sanitizado

### 2. LLM API: Abacus.AI → OpenAI
- **Substituído**: `https://apps.abacus.ai/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
- **Substituído**: `https://api.abacus.ai/chat/complete` → `https://api.openai.com/v1/chat/completions`
- **Env var**: `ABACUSAI_API_KEY` → `OPENAI_API_KEY`
- Modelos mantidos: `gpt-4o` e `gpt-4o-mini`

### 3. Arquivos Modificados
- `app/api/upload/route.ts` — import s3 → storage
- `app/api/bills/upload/route.ts` — import s3 → storage
- `app/api/ocr/process/route.ts` — import s3 → storage + OpenAI API
- `app/api/bills/ocr/route.ts` — import s3 → storage + OpenAI API
- `app/api/chat/validate/route.ts` — OpenAI API
- `app/api/chat/extract-corrections/route.ts` — OpenAI API
- `lib/categorization.ts` — OpenAI API
- `prisma/schema.prisma` — removido output fixo, binaryTargets = ["native"]
- `.env.example` — atualizado com novas variáveis

### 4. Arquivos Removidos
- `lib/s3.ts`
- `lib/aws-config.ts`
- `app/api/test-env/route.ts`

### 5. Variáveis de Ambiente Necessárias (.env)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://xxx.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

### 6. Deploy na Vercel
1. Conectar repo GitHub no Vercel
2. Root Directory: `nextjs_space`
3. Build Command: `prisma generate && next build`
4. Configurar variáveis de ambiente
5. O `postinstall: prisma generate` deve ser adicionado ao package.json real (não o symlink da Abacus)

### 7. Migração dos Arquivos
- 374 arquivos migrados de S3 para Supabase Storage (bucket `receipts`)
- Todos os caminhos foram sanitizados com a mesma função `sanitizeKey()`
- Zero colisões, zero exceções necessárias
- O bucket deve ser configurado como PRIVADO no Supabase Dashboard

### 8. Pendências
- [ ] Configurar bucket `receipts` como PRIVADO no Supabase Dashboard
- [ ] Adicionar `"postinstall": "prisma generate"` no package.json real (fora do symlink Abacus)
- [ ] Remover dependências `@aws-sdk/*` do package.json real
- [ ] next.config.js: remover distDir/output/outputFileTracingRoot (bloqueado no ambiente Abacus, fazer manualmente)
- [ ] Instalar `@supabase/supabase-js` no package.json real
- [ ] Testar build completo na Vercel
