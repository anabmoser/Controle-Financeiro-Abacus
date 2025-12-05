# 📋 Guia do Módulo de Boletos e Fornecedores

## 🎯 Visão Geral

O módulo de **Boletos a Pagar** foi implementado com sucesso no sistema de Controle Financeiro do Restaurante. Agora você pode gerenciar completamente seus boletos, fornecedores e ter alertas automáticos de vencimento.

---

## ✨ Funcionalidades Implementadas

### 1. **Gestão de Fornecedores** 📇

#### Página: `/fornecedores`

**Recursos:**
- ✅ Cadastro completo de fornecedores
- ✅ Edição de informações
- ✅ Exclusão de fornecedores
- ✅ Busca por nome ou CNPJ
- ✅ Visualização de quantos boletos cada fornecedor possui

**Campos disponíveis:**
- Nome do fornecedor (obrigatório)
- CNPJ
- E-mail
- Telefone
- Endereço
- Pessoa de contato
- Observações
- Status (Ativo/Inativo)

**Como usar:**
1. Acesse a aba **"Fornecedores"** no menu
2. Clique em **"Novo Fornecedor"**
3. Preencha os dados do fornecedor
4. Clique em **"Cadastrar"**

---

### 2. **Gestão de Boletos** 💰

#### Página: `/boletos`

**Recursos:**
- ✅ Cadastro de boletos com upload de arquivo
- ✅ Controle de parcelas
- ✅ Filtros por status e fornecedor
- ✅ Marcação de boleto como pago
- ✅ Exclusão de boletos
- ✅ Download dos arquivos anexados
- ✅ Alertas visuais de vencimento

**Campos disponíveis:**
- Fornecedor (obrigatório)
- Descrição (obrigatório)
- Valor total (obrigatório)
- Data de vencimento (obrigatório)
- Número do boleto
- Data de emissão
- Número de parcelas
- Arquivo do boleto (PDF ou imagem)
- Observações

**Status dos boletos:**
- 🔵 **Pendente** - Mais de 3 dias para vencer
- 🟡 **Vence em breve** - Até 3 dias para vencer
- 🔴 **Vencido** - Prazo já passou
- 🟢 **Pago** - Boleto quitado

**Como cadastrar um boleto:**
1. Acesse a aba **"Boletos"** no menu
2. Clique em **"Novo Boleto"**
3. Selecione o fornecedor (se não existir, cadastre primeiro)
4. Preencha os dados do boleto
5. (Opcional) Anexe o arquivo PDF ou imagem do boleto
6. Clique em **"Cadastrar"**

**Como marcar um boleto como pago:**
1. Na lista de boletos, encontre o boleto pendente
2. Clique no botão **"Marcar como Pago"**
3. O boleto será automaticamente marcado com a data de pagamento

---

### 3. **Alertas de Vencimento** ⚠️

#### Dashboard Atualizado

O **Dashboard** agora exibe automaticamente:

**Card Vermelho - Boletos Vencidos:**
- Lista todos os boletos que já passaram do vencimento
- Mostra quantos dias estão vencidos
- Exibe fornecedor e valor
- Botão para ir direto à página de boletos

**Card Amarelo - Próximos a Vencer:**
- Lista boletos que vencem nos próximos 7 dias
- Mostra data de vencimento
- Exibe fornecedor e valor
- Botão para ir direto à página de boletos

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `suppliers` (Fornecedores)
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  contact_person VARCHAR(255),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela `bills` (Boletos)
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  bill_number VARCHAR(100),
  description VARCHAR(500) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  installments INT DEFAULT 1,
  current_installment INT DEFAULT 1,
  installment_amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  issue_date TIMESTAMPTZ,
  payment_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Passo 1: Cadastrar Fornecedores
Antes de cadastrar boletos, cadastre todos os seus fornecedores principais.

### Passo 2: Cadastrar Boletos
Ao receber um boleto:
1. Acesse a página de Boletos
2. Cadastre com todas as informações
3. Anexe o arquivo PDF/imagem do boleto

### Passo 3: Monitorar Vencimentos
- Acesse o Dashboard diariamente
- Verifique os alertas de boletos vencidos e próximos a vencer
- Marque como pago após efetuar o pagamento

### Passo 4: Manter Histórico
Todos os boletos pagos ficam registrados no sistema para consulta futura.

---

## 📊 APIs Disponíveis

### Fornecedores
- `GET /api/suppliers` - Lista todos os fornecedores
- `POST /api/suppliers` - Cria novo fornecedor
- `PUT /api/suppliers` - Atualiza fornecedor
- `DELETE /api/suppliers?id={id}` - Deleta fornecedor

### Boletos
- `GET /api/bills` - Lista boletos (com filtros)
- `POST /api/bills` - Cria novo boleto (com upload)
- `PUT /api/bills` - Atualiza boleto
- `DELETE /api/bills?id={id}` - Deleta boleto
- `GET /api/bills/upcoming?days=7` - Boletos próximos ao vencimento
- `GET /api/bills/stats` - Estatísticas de boletos

---

## 🎨 Interface

### Cores e Indicadores

**Status dos Boletos:**
- 🔵 Azul - Pendente (mais de 3 dias)
- 🟡 Amarelo - Vence em breve (até 3 dias)
- 🔴 Vermelho - Vencido
- 🟢 Verde - Pago

**Cards no Dashboard:**
- Borda vermelha - Boletos vencidos (ação urgente)
- Borda amarela - Boletos próximos (atenção)

---

## 💡 Dicas de Uso

1. **Cadastre fornecedores primeiro**: Facilita o cadastro de boletos posteriormente

2. **Use o campo "Observações"**: Anote informações importantes sobre cada boleto

3. **Anexe sempre o arquivo**: Facilita a consulta futura sem precisar buscar o boleto físico

4. **Configure parcelas**: Se um boleto tem várias parcelas, informe no campo "Número de Parcelas"

5. **Marque como pago imediatamente**: Após efetuar o pagamento, marque no sistema para manter o controle atualizado

6. **Use os filtros**: Na página de boletos, filtre por status ou fornecedor para encontrar rapidamente o que precisa

7. **Monitore o Dashboard**: Acesse diariamente para não perder nenhum vencimento

---

## 🚀 Status Atual

✅ **Totalmente funcional e deployado em:**
- URL: https://controle-compras-res-d7yzxl.abacusai.app

✅ **Integrado com:**
- Supabase (PostgreSQL)
- AWS S3 (armazenamento de arquivos)
- Sistema de categorização automática existente

✅ **Recursos adicionais:**
- Navbar atualizada com links para Boletos e Fornecedores
- Dashboard com alertas visuais
- Interface responsiva e intuitiva

---

## 📝 Próximas Melhorias Sugeridas

1. **Notificações por e-mail**: Enviar alertas automáticos de vencimento
2. **Relatórios de boletos**: Gerar relatórios mensais/anuais
3. **Integração bancária**: Importar boletos direto do banco
4. **Agendamento de pagamentos**: Agendar pagamentos futuros
5. **Dashboard de fluxo de caixa**: Projeção de saídas baseada nos boletos

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se todos os fornecedores estão cadastrados antes de criar boletos
2. Certifique-se de que as datas estão no formato correto
3. Arquivos devem ser PDF, JPG ou PNG (máximo 10MB)
4. Em caso de erro, verifique o console do navegador (F12)

---

**Desenvolvido por:** Abacus.AI Deep Agent
**Data:** Dezembro 2025
**Versão:** 1.0
