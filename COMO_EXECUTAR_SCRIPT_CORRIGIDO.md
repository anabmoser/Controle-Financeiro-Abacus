# Como Corrigir o Erro de Conexão com Banco de Dados

## Problema Identificado

O erro `MaxClientsInSessionMode: max clients reached` ocorre porque o Supabase Session Pooler (porta 5432) tem um limite baixo de conexões simultâneas.

## Solução

### Opção 1: Usar Transaction Pooler (RECOMENDADO)

**PASSO 1**: Edite o arquivo `.env` localizado em:
```
/home/ubuntu/controle_compras_restaurante/nextjs_space/.env
```

**PASSO 2**: Altere a porta na linha `DATABASE_URL` de `5432` para `6543`:

**ANTES:**
```env
DATABASE_URL='postgresql://postgres.ixyxegpijupehxykntck:iqAoMmmhV6b8Ls7D@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true'
```

**DEPOIS:**
```env
DATABASE_URL='postgresql://postgres.ixyxegpijupehxykntck:iqAoMmmhV6b8Ls7D@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
```

**PASSO 3**: Salve o arquivo

**PASSO 4**: Reinicie o servidor
```bash
cd /home/ubuntu/controle_compras_restaurante/nextjs_space
yarn run dev
```

### Opção 2: Ajustar pool_size manualmente

Adicione `&pool_size=20` ao final da URL:
```env
DATABASE_URL='postgresql://postgres.ixyxegpijupehxykntck:iqAoMmmhV6b8Ls7D@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&pool_size=20'
```

## O que mudou no código?

Corrigimos o endpoint da API da Abacus.AI de:
- ❌ `https://apis.abacus.ai/v1/chat/completions`
- ✅ `https://apps.abacus.ai/v1/chat/completions`

Esta correção resolve o erro "fetch failed" que estava impedindo o OCR de funcionar.

## Testando a Solução

Após fazer a alteração, você pode testar o OCR executando:
```bash
cd /home/ubuntu/controle_compras_restaurante/nextjs_space
node test_api_corrected.js
```

Deve retornar:
```
✅ SUCESSO! Resposta da API: OK
```

## Notas Importantes

1. **Transaction Pooler vs Session Pooler:**
   - Transaction Pooler (porta 6543): Suporta mais conexões (até 200)
   - Session Pooler (porta 5432): Limite de 5-10 conexões

2. **O OCR agora está corrigido** e deve processar boletos automaticamente

3. **Todos os boletos com erro** podem ser reprocessados clicando no botão de reprocessar na interface

## Próximos Passos

Depois de fazer a alteração no `.env`, o sistema estará pronto para:
- ✅ Upload de boletos (PDF, JPG, PNG)
- ✅ Extração automática de dados via OCR
- ✅ Registro completo de informações (fornecedor, valor, vencimento)
- ✅ Dashboard com estatísticas de pagamentos
