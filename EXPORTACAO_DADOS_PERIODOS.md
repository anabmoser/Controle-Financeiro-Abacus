# 📊 Guia de Exportação de Dados - Aba Períodos

**Data de Implementação**: 8 de dezembro de 2025  
**Funcionalidade**: Exportação de dados em Excel e CSV  
**Página**: https://controle-compras-res-d7yzxl.abacusai.app/periodos

---

## 🎯 O Que Foi Implementado

Agora você pode **exportar todos os dados da aba Períodos** em dois formatos:

1. **Excel (.xlsx)** - Arquivo formatado, ideal para análises e gráficos
2. **CSV** - Arquivo simples, compatível com qualquer planilha

---

## 📍 Onde Encontrar

### Localização dos Botões de Exportação

Na página **Períodos** (https://controle-compras-res-d7yzxl.abacusai.app/periodos), após fazer uma busca, você verá botões de **"Exportar"** em cada aba:

1. **Aba Compras** - Exporta lista completa de compras com todos os itens
2. **Aba Por Produto** - Exporta análise por produto (quantidade, valor, preço médio)
3. **Aba Por Fornecedor** - Exporta dados agrupados por fornecedor
4. **Aba Por Categoria** - Exporta totais por categoria

---

## 🚀 Como Usar

### Passo 1: Filtrar Dados

1. Acesse: https://controle-compras-res-d7yzxl.abacusai.app/periodos
2. Defina os filtros:
   - **Data Inicial** (opcional)
   - **Data Final** (opcional)
   - **Fornecedor** (opcional)
   - **Produto** (opcional)
3. Clique em **"Buscar"**

### Passo 2: Escolher a Aba

4. Navegue até a aba desejada:
   - **Compras** - Para ver lista detalhada de compras
   - **Por Produto** - Para análise de produtos
   - **Por Fornecedor** - Para análise de fornecedores
   - **Por Categoria** - Para análise por categoria

### Passo 3: Exportar

5. No canto superior direito da aba, clique no botão **"Exportar"**
6. Escolha o formato:
   - **Exportar Excel (.xlsx)** - Arquivo formatado
   - **Exportar CSV** - Arquivo de texto separado por vírgulas
7. O download começará automaticamente!

---

## 📋 Estrutura dos Arquivos Exportados

### 1. Exportação de Compras

**Nome do arquivo**: `compras_[periodo].xlsx` ou `compras_[periodo].csv`

| Coluna | Descrição | Exemplo |
|--------|-----------|--------|
| Data | Data da compra | 06/12/2025 |
| Fornecedor | Nome do fornecedor | Comercial e Importadora São Sebastian |
| CNPJ | CNPJ do fornecedor | 71.038.764/0001-14 |
| Produto | Nome do produto | CR LEITE P COMEVAP 500G |
| Quantidade | Quantidade comprada | 1 |
| Unidade | Unidade de medida | un |
| Preço Unitário | Preço por unidade | R$ 26,90 |
| Preço Total | Total do item | R$ 26,90 |
| Categoria | Categoria do produto | Laticínios |
| Total da Compra | Total da nota fiscal | R$ 368,65 |

**Nota**: Cada linha representa um item. O total da compra aparece apenas na primeira linha de cada nota.

---

### 2. Exportação Por Produto

**Nome do arquivo**: `produtos_[periodo].xlsx` ou `produtos_[periodo].csv`

| Coluna | Descrição | Exemplo |
|--------|-----------|--------|
| Produto | Nome do produto | QJ PARM PED NOAL |
| Categoria | Categoria | Laticínios |
| Nº de Compras | Quantas vezes foi comprado | 5 |
| Quantidade Total | Soma das quantidades | 1.44 |
| Valor Total | Soma dos valores | R$ 143,66 |
| Preço Médio | Valor total / quantidade | R$ 99,76 |

---

### 3. Exportação Por Fornecedor

**Nome do arquivo**: `fornecedores_[periodo].xlsx` ou `fornecedores_[periodo].csv`

| Coluna | Descrição | Exemplo |
|--------|-----------|--------|
| Fornecedor | Nome do fornecedor | CIA BRASILEIRA DE DISTRIBUICAO |
| CNPJ | CNPJ | 47.508.411/1036-30 |
| Nº de Compras | Total de compras | 1 |
| Total de Itens | Total de itens | 11 |
| Valor Total | Soma dos valores | R$ 332,65 |
| Ticket Médio | Valor total / nº compras | R$ 332,65 |

---

### 4. Exportação Por Categoria

**Nome do arquivo**: `categorias_[periodo].xlsx` ou `categorias_[periodo].csv`

| Coluna | Descrição | Exemplo |
|--------|-----------|--------|
| Categoria | Nome da categoria | Laticínios |
| Cor | Cor da categoria | blue |
| Nº de Itens | Total de itens | 10 |
| Valor Total | Soma dos valores | R$ 270,50 |

---

## 📂 Nomenclatura dos Arquivos

Os arquivos exportados têm nomes descritivos baseados nos filtros aplicados:

### Exemplos:

| Filtro Aplicado | Nome do Arquivo |
|----------------|----------------|
| Data: 01/12/2025 a 31/12/2025 | `compras_2025-12-01_2025-12-31.xlsx` |
| Apenas data inicial | `compras_desde_2025-12-01.xlsx` |
| Apenas data final | `compras_ate_2025-12-31.xlsx` |
| Sem filtros | `compras_todos.xlsx` |
| Produtos no período | `produtos_2025-12-01_2025-12-31.xlsx` |
| Fornecedores | `fornecedores_todos.csv` |
| Categorias | `categorias_desde_2025-11-01.csv` |

---

## 💡 Dicas de Uso

### 1. Qual formato escolher?

| Situação | Formato Recomendado |
|----------|--------------------|
| Análise no Excel/Google Sheets | **Excel (.xlsx)** |
| Importar para sistema de gestão | **CSV** |
| Enviar por email | **Excel (.xlsx)** |
| Máxima compatibilidade | **CSV** |
| Preservar formatação | **Excel (.xlsx)** |

### 2. Exportações Úteis

#### 📊 Relatório Mensal
```
1. Filtrar: Mês atual (ex: 01/12/2025 a 31/12/2025)
2. Exportar cada aba:
   - Compras completas
   - Por Produto
   - Por Fornecedor
   - Por Categoria
3. Resultado: 4 arquivos Excel com análise completa do mês
```

#### 🔍 Análise de Fornecedor Específico
```
1. Filtrar: Fornecedor = "Pão de Açúcar"
2. Exportar aba "Por Produto"
3. Resultado: Lista de todos os produtos comprados desse fornecedor
```

#### 📈 Histórico de Produto
```
1. Filtrar: Produto = "Tomate"
2. Exportar aba "Compras"
3. Resultado: Histórico completo de compras com preços
```

#### 💰 Análise de Gastos por Categoria
```
1. Filtrar: Período desejado
2. Exportar aba "Por Categoria"
3. Resultado: Distribuição dos gastos por categoria
```

---

## 🎯 Casos de Uso Práticos

### 1. Prestação de Contas

**Objetivo**: Gerar relatório para contador

```
✅ Filtrar: Mês de referência
✅ Exportar: Aba "Compras" em Excel
✅ Enviar: Arquivo contém todas as notas fiscais do período
```

### 2. Negociação com Fornecedor

**Objetivo**: Mostrar volume de compras

```
✅ Filtrar: Fornecedor específico + último trimestre
✅ Exportar: Aba "Por Fornecedor" em Excel
✅ Usar: Dados para negociar desconto por volume
```

### 3. Controle de Estoque

**Objetivo**: Identificar produtos mais comprados

```
✅ Filtrar: Últimos 3 meses
✅ Exportar: Aba "Por Produto" em Excel
✅ Analisar: Produtos com maior frequência de compra
```

### 4. Análise de Custos

**Objetivo**: Identificar categorias com maior gasto

```
✅ Filtrar: Ano inteiro
✅ Exportar: Aba "Por Categoria" em Excel
✅ Criar: Gráfico de pizza no Excel com distribuição
```

### 5. Auditoria

**Objetivo**: Verificar todas as compras de um período

```
✅ Filtrar: Período específico
✅ Exportar: Todas as abas em Excel
✅ Resultado: Dossiê completo para auditoria
```

---

## 📊 Análises Possíveis com os Dados Exportados

### No Excel/Google Sheets:

1. **Gráficos de Pizza**
   - Distribuição de gastos por categoria
   - Participação de cada fornecedor

2. **Gráficos de Linha**
   - Evolução de preços ao longo do tempo
   - Tendência de gastos mensais

3. **Tabelas Dinâmicas**
   - Análise cruzada: Categoria × Fornecedor
   - Produtos mais comprados por período

4. **Análise de Variação de Preços**
   - Comparar preço unitário entre compras
   - Identificar melhores momentos de compra

5. **Previsão de Gastos**
   - Média mensal de gastos
   - Projeção para próximos meses

---

## ⚙️ Detalhes Técnicos

### Tecnologias Utilizadas

- **Biblioteca Excel**: `xlsx` (SheetJS)
- **Formato CSV**: Geração nativa com codificação UTF-8
- **Compressão**: Automática pelo navegador

### Compatibilidade

| Software | Excel (.xlsx) | CSV |
|----------|:-------------:|:---:|
| Microsoft Excel | ✅ | ✅ |
| Google Sheets | ✅ | ✅ |
| LibreOffice Calc | ✅ | ✅ |
| Numbers (Mac) | ✅ | ✅ |
| Sistemas de ERP | ⚠️ | ✅ |

**Nota**: CSV é mais universal para importação em sistemas.

### Codificação

- **Excel**: UTF-8 com BOM (garante caracteres especiais)
- **CSV**: UTF-8 (caracteres acentuados preservados)

---

## 🔧 Solução de Problemas

### Problema: "Nenhum dado para exportar"

**Causa**: Não há dados nos filtros aplicados

**Solução**:
1. Verifique se fez a busca primeiro
2. Ajuste os filtros (datas, fornecedor, produto)
3. Clique em "Buscar" novamente

---

### Problema: Arquivo CSV com caracteres estranhos

**Causa**: Editor não reconhece UTF-8

**Solução**:
- No Excel: Importar como "UTF-8"
- No Google Sheets: Faz automaticamente
- Em editores: Abrir com codificação UTF-8

---

### Problema: Download não inicia

**Causa**: Bloqueador de pop-ups

**Solução**:
1. Desabilite bloqueador de pop-ups para o site
2. Tente novamente
3. Verifique permissões do navegador

---

### Problema: Valores com vírgula quebram colunas no CSV

**Causa**: CSV mal formatado

**Solução**:
- Use a exportação Excel (.xlsx)
- Ou abra o CSV no Excel/Sheets que corrige automaticamente

---

## 📋 Checklist de Exportação

Antes de exportar, verifique:

- [ ] Filtros aplicados corretamente
- [ ] Clicou em "Buscar"
- [ ] Dados apareceram na tela
- [ ] Escolheu a aba correta
- [ ] Selecionou o formato desejado (Excel ou CSV)
- [ ] Baixou o arquivo
- [ ] Abriu o arquivo para verificar

---

## 🎓 Exemplos de Fluxos Completos

### Fluxo 1: Relatório Mensal para Contador

```
1. Acesse: /periodos
2. Filtros:
   - Data Inicial: 01/11/2025
   - Data Final: 30/11/2025
3. Buscar
4. Aba "Compras" → Exportar Excel
5. Resultado: compras_2025-11-01_2025-11-30.xlsx
6. Enviar para contador
```

### Fluxo 2: Análise de Produtos para Negociação

```
1. Acesse: /periodos
2. Filtros:
   - Data Inicial: 01/09/2025 (3 meses atrás)
   - Fornecedor: "Atacadão"
3. Buscar
4. Aba "Por Produto" → Exportar Excel
5. Abrir no Excel
6. Ordenar por "Valor Total" (maior para menor)
7. Negociar desconto nos produtos de maior volume
```

### Fluxo 3: Dashboard de Gastos

```
1. Exportar 4 arquivos do mês:
   - compras_mes_atual.xlsx
   - produtos_mes_atual.xlsx
   - fornecedores_mes_atual.xlsx
   - categorias_mes_atual.xlsx

2. No Excel:
   - Criar gráfico de pizza com "categorias"
   - Criar gráfico de barras com "fornecedores"
   - Criar tabela de "produtos mais comprados"

3. Resultado: Dashboard visual dos gastos
```

---

## 📈 Próximos Passos Sugeridos

### Para você:

1. **Teste a exportação**
   - Faça uma busca com suas compras
   - Exporte em Excel e CSV
   - Abra os arquivos para verificar

2. **Crie seu primeiro relatório**
   - Exporte dados do mês atual
   - Analise no Excel/Google Sheets
   - Identifique insights sobre seus gastos

3. **Automatize seu processo**
   - Todo fim de mês, exporte relatórios
   - Envie para contador/gestor
   - Archive para histórico

### Funcionalidades Futuras (sugestões):

- [ ] Exportação com gráficos incluídos
- [ ] Email automático de relatórios
- [ ] Agendamento de exportações
- [ ] Exportação em PDF
- [ ] Templates personalizados

---

## ✅ Resumo

### O Que Você Pode Fazer Agora:

✅ Exportar **lista completa de compras** com todos os detalhes  
✅ Exportar **análise por produto** (quantidade, valor, preço médio)  
✅ Exportar **análise por fornecedor** (compras, ticket médio)  
✅ Exportar **análise por categoria** (distribuição de gastos)  
✅ Escolher entre **Excel (.xlsx)** ou **CSV**  
✅ Filtrar por **data, fornecedor e produto**  
✅ Arquivos com **nomes descritivos** automáticos  
✅ **Compatível** com Excel, Google Sheets, LibreOffice  

---

## 🔗 Links Úteis

- **Página Períodos**: https://controle-compras-res-d7yzxl.abacusai.app/periodos
- **Dashboard**: https://controle-compras-res-d7yzxl.abacusai.app/dashboard
- **Upload de Cupons**: https://controle-compras-res-d7yzxl.abacusai.app/upload
- **Produtos**: https://controle-compras-res-d7yzxl.abacusai.app/produtos
- **Categorias**: https://controle-compras-res-d7yzxl.abacusai.app/categorias

---

## 📞 Suporte

Se tiver dúvidas ou problemas com a exportação:

1. Verifique se fez a busca antes de exportar
2. Tente limpar os filtros e buscar novamente
3. Teste com diferentes formatos (Excel e CSV)
4. Verifique se o navegador não bloqueou o download

---

**Documento criado em**: 8 de dezembro de 2025  
**Última atualização**: 8 de dezembro de 2025  
**Versão do sistema**: 2.0 (com exportação)  
**Status**: ✅ Implementado e Testado
