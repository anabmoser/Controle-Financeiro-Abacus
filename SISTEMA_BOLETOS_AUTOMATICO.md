# Sistema de Boletos com Upload e OCR Automático

## 📋 Visão Geral

O sistema de controle de boletos foi completamente reformulado para funcionar com **upload automático e extração inteligente de dados via OCR**. Não é mais necessário cadastrar fornecedores ou preencher formulários manualmente.

## ✨ Como Funciona

### 1. **Upload Simples**
- Acesse a aba **"Boletos"** no menu principal
- Clique na área de upload ou arraste o arquivo do boleto
- Formatos aceitos: **PDF, JPG, PNG** (máx. 10MB)
- O sistema envia o arquivo para a nuvem (AWS S3)

### 2. **Extração Automática (OCR)**
O sistema usa **GPT-4o Vision** para extrair automaticamente:
- ✅ Nome do fornecedor/beneficiário
- ✅ CNPJ (se disponível)
- ✅ Valor total do boleto
- ✅ Data de vencimento
- ✅ Data de emissão
- ✅ Número do boleto
- ✅ Código de barras/linha digitável
- ✅ Descrição do serviço

### 3. **Organização Automática**
Os boletos são automaticamente classificados por status:
- 🔴 **Vencidos**: Boletos com data de vencimento passada
- 🟡 **A Vencer**: Boletos com vencimento nos próximos dias
- 🔵 **Pendentes**: Demais boletos não pagos
- 🟢 **Pagos**: Boletos marcados como pagos

## 🎯 Funcionalidades

### Página de Boletos (`/boletos`)

#### **Área de Upload**
- Upload com drag & drop
- Processamento em tempo real
- Feedback visual do progresso (Upload → OCR)
- Mensagens de erro claras em caso de falha

#### **Estatísticas Rápidas**
- Total de boletos cadastrados
- Quantidade de boletos vencidos
- Quantidade de boletos a vencer
- Quantidade de boletos pagos
- Valor total pendente (R$)

#### **Filtros**
- **Todos**: Exibe todos os boletos
- **Vencidos**: Apenas boletos com vencimento atrasado
- **A Vencer**: Apenas boletos com vencimento futuro
- **Pagos**: Apenas boletos já quitados

#### **Lista de Boletos**
Cada boleto exibe:
- Nome do fornecedor
- CNPJ (se disponível)
- Valor
- Data de vencimento
- Status visual (cor e badge)
- Descrição (se disponível)
- Número do boleto
- Data de pagamento (se pago)

#### **Ações Disponíveis**
- 📥 **Download**: Baixar o arquivo original do boleto
- ✅ **Marcar como Pago**: Registrar pagamento (data automática)
- 🗑️ **Excluir**: Remover boleto do sistema

### Dashboard (`/dashboard`)

#### **Alertas de Boletos**
O dashboard exibe automaticamente:

**🔴 Boletos Vencidos**
- Card vermelho com contagem
- Lista dos boletos vencidos
- Dias de atraso
- Valor total
- Link para página de boletos

**🟡 Boletos Próximos ao Vencimento**
- Card amarelo com contagem
- Boletos que vencem nos próximos 7 dias
- Dias restantes até o vencimento
- Valor total
- Link para página de boletos

## 🔧 Estrutura Técnica

### Banco de Dados

Tabela `bills`:
```sql
- id: UUID (chave primária)
- supplier_name: VARCHAR(255) -- Nome extraído do boleto
- supplier_cnpj: VARCHAR(18) -- CNPJ extraído (opcional)
- bill_number: VARCHAR(100) -- Número do documento
- bar_code: VARCHAR(100) -- Código de barras
- description: TEXT -- Descrição do serviço
- total_amount: DECIMAL(10,2) -- Valor total
- due_date: TIMESTAMP -- Data de vencimento
- issue_date: TIMESTAMP -- Data de emissão
- payment_date: TIMESTAMP -- Data de pagamento
- status: VARCHAR(20) -- pending | paid
- file_url: VARCHAR -- Caminho no S3
- file_name: VARCHAR -- Nome original
- file_size: BIGINT -- Tamanho em bytes
- file_type: VARCHAR(50) -- Tipo MIME
- ocr_status: VARCHAR(20) -- pending | processing | completed | error
- ocr_result: JSON -- Dados brutos do OCR
- ocr_error: TEXT -- Mensagem de erro (se houver)
- notes: TEXT -- Observações manuais
- created_at: TIMESTAMP
```

### Endpoints de API

#### `POST /api/bills/upload`
**Faz upload do arquivo do boleto**

**Request:**
```javascript
FormData {
  file: File (PDF/JPG/PNG)
}
```

**Response:**
```json
{
  "billId": "uuid",
  "cloudStoragePath": "bills/timestamp-filename.pdf",
  "message": "Arquivo enviado com sucesso. Processando OCR..."
}
```

#### `POST /api/bills/ocr`
**Processa OCR do boleto**

**Request:**
```json
{
  "billId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "bill": {
    "id": "uuid",
    "supplierName": "EMPRESA XYZ LTDA",
    "supplierCnpj": "12.345.678/0001-90",
    "totalAmount": 1234.56,
    "dueDate": "2025-01-15",
    "barCode": "12345678901234567890...",
    ...
  },
  "message": "OCR processado com sucesso"
}
```

#### `GET /api/bills`
**Lista todos os boletos**

**Query Params:**
- `status`: pending | paid
- `supplierName`: filtro por nome
- `month`: mês (1-12)
- `year`: ano (YYYY)

**Response:**
```json
{
  "bills": [
    {
      "id": "uuid",
      "supplierName": "EMPRESA XYZ",
      "totalAmount": 1234.56,
      "dueDate": "2025-01-15T00:00:00Z",
      "status": "pending",
      ...
    }
  ]
}
```

#### `PUT /api/bills`
**Atualiza um boleto**

**Request:**
```json
{
  "id": "uuid",
  "status": "paid",
  "paymentDate": "2025-01-10T10:30:00Z"
}
```

#### `DELETE /api/bills`
**Exclui um boleto**

**Request:**
```json
{
  "id": "uuid"
}
```

#### `GET /api/bills/upcoming?days=7`
**Boletos próximos ao vencimento**

**Response:**
```json
{
  "upcoming": [...], // Boletos que vencem nos próximos X dias
  "overdue": [...],  // Boletos vencidos
  "total": 5
}
```

#### `GET /api/bills/stats`
**Estatísticas de boletos**

**Response:**
```json
{
  "pendingCount": 10,
  "overdueCount": 2,
  "totalPending": 5432.10,
  "totalPaidThisMonth": 3210.50,
  "totalDueThisMonth": 2150.00
}
```

## 🎨 Interface do Usuário

### Indicadores Visuais

**Status dos Boletos:**
- 🔴 **Vermelho**: Vencido há X dias
- 🟡 **Amarelo**: Vence em 1-3 dias
- 🔵 **Azul**: Vence em 4+ dias
- 🟢 **Verde**: Pago

**Ícones:**
- 📥 Download
- ✅ Marcar como pago
- 🗑️ Excluir
- 📄 Boleto
- 📅 Calendário
- ⚠️ Alerta

### Experiência de Upload

1. **Estado Inicial**: Área de upload com ícone e texto
2. **Enviando**: Spinner + "Enviando arquivo..."
3. **Processando OCR**: Spinner + "Processando OCR..."
4. **Sucesso**: Mensagem verde + atualização da lista
5. **Erro**: Alerta vermelho com descrição do problema

## 🚀 Fluxo de Uso

### Cenário 1: Novo Boleto
```
1. Usuário acessa /boletos
2. Clica na área de upload
3. Seleciona arquivo PDF do boleto
4. Sistema faz upload → OCR → salva
5. Boleto aparece na lista automaticamente
6. Status inicial: "Pendente" ou "A Vencer"
```

### Cenário 2: Pagar Boleto
```
1. Usuário vê boleto vencido no dashboard
2. Clica em "Ver Todos os Boletos"
3. Encontra o boleto na lista
4. Clica no botão ✅
5. Status muda para "Pago"
6. Data de pagamento registrada automaticamente
```

### Cenário 3: Erro no OCR
```
1. Upload bem-sucedido
2. OCR falha (imagem ilegível/corrupta)
3. Alerta vermelho no card do boleto
4. Mensagem de erro visível
5. Usuário pode tentar reenviar arquivo de melhor qualidade
```

## 🔒 Segurança

- ✅ Arquivos armazenados em S3 privado
- ✅ URLs assinadas com expiração (1 hora)
- ✅ Validação de tipos de arquivo (PDF, JPG, PNG)
- ✅ Limite de tamanho (10MB)
- ✅ Sanitização de nomes de arquivo
- ✅ Dados sensíveis no banco PostgreSQL

## 📊 Dados de Exemplo

### Antes (Sistema Antigo)
```
❌ Cadastrar fornecedor manualmente
❌ Preencher formulário com 10 campos
❌ Fazer upload separado do arquivo
❌ Criar parcelas manualmente
❌ Calcular valores
```

### Agora (Sistema Novo)
```
✅ Upload de 1 arquivo
✅ Tudo extraído automaticamente
✅ Zero digitação
✅ Processamento em segundos
✅ Organização automática
```

## 🐛 Tratamento de Erros

### Erros Comuns

**1. Arquivo muito grande**
```
"Arquivo muito grande. Tamanho máximo: 10MB"
```

**2. Tipo de arquivo inválido**
```
"Tipo de arquivo não permitido. Use PDF, JPG ou PNG."
```

**3. OCR falhou**
```
"Não foi possível extrair dados essenciais do boleto"
- Tente uma imagem de melhor qualidade
- Verifique se o boleto está legível
- Certifique-se de que é um boleto bancário válido
```

**4. Arquivo corrompido**
```
"Erro ao processar OCR"
- Arquivo pode estar corrompido
- Tente fazer download novamente do boleto
```

## 💡 Dicas

### Para Melhor Precisão do OCR

1. **Use PDFs originais** quando possível
2. **Fotos nítidas**: Se for tirar foto, garanta boa iluminação
3. **Enquadramento**: Capture todo o boleto
4. **Resolução**: Mínimo 300 DPI para imagens
5. **Contraste**: Evite fundos muito claros/escuros

### Organização

1. Faça upload assim que receber o boleto
2. Use os filtros para ver boletos por status
3. Marque como pago imediatamente após o pagamento
4. Verifique o dashboard diariamente para alertas
5. Use a busca por fornecedor para encontrar boletos específicos

## 🔄 Migração do Sistema Antigo

### O que mudou?

**Removido:**
- ❌ Tabela `Supplier` (fornecedores)
- ❌ Campos `installments` e `currentInstallment`
- ❌ Relação obrigatória Bill → Supplier
- ❌ Aba "Fornecedores" no menu
- ❌ Formulários de cadastro manual

**Adicionado:**
- ✅ Campos `supplierName` e `supplierCnpj` direto no Bill
- ✅ Campos de OCR (status, result, error)
- ✅ Campos de arquivo (size, type)
- ✅ Campo `barCode` para código de barras
- ✅ Endpoint `/api/bills/upload`
- ✅ Endpoint `/api/bills/ocr`
- ✅ Interface de upload moderna

**Mantido:**
- ✅ Dashboard com alertas
- ✅ Filtros por status
- ✅ Download de arquivos
- ✅ Estatísticas
- ✅ Integração com AWS S3
- ✅ Banco de dados Supabase

## 📝 Notas Técnicas

### Modelo de IA
- **Modelo**: GPT-4o (via Abacus.AI)
- **Temperatura**: 0.0 (máxima precisão)
- **Contexto**: Visão de documentos
- **Timeout**: 30 segundos
- **Retry**: Não implementado (usar reenvio manual)

### Performance
- **Upload**: ~2-3 segundos
- **OCR**: ~5-8 segundos
- **Total**: ~10 segundos por boleto
- **Concorrência**: Suporta múltiplos uploads

### Armazenamento
- **Arquivos**: AWS S3 (bucket privado)
- **Banco**: Supabase PostgreSQL
- **Cache**: Não implementado
- **CDN**: Não implementado (URLs assinadas)

## 🎯 Próximos Passos (Futuro)

### Possíveis Melhorias
1. ✨ Upload em lote (múltiplos boletos)
2. ✨ Integração com bancos (pagamento automático)
3. ✨ Notificações por email/WhatsApp
4. ✨ Relatórios de pagamentos
5. ✨ Exportação para Excel/PDF
6. ✨ Calendário visual de vencimentos
7. ✨ Histórico de edições
8. ✨ Comentários e anexos adicionais

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o arquivo é um boleto válido
2. Teste com diferentes formatos (PDF vs imagem)
3. Verifique os logs no console do navegador
4. Entre em contato com o suporte técnico

---

**Data de Criação**: 05/12/2024  
**Versão**: 2.0  
**Sistema**: Controle Financeiro de Restaurante  
**Tecnologias**: Next.js 14, PostgreSQL, AWS S3, GPT-4o
