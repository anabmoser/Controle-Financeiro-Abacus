# 📊 Guia de Exportação de Dados - Página Períodos

## 🎯 Localização dos Botões de Exportação

Os botões de exportação **SÓ APARECEM DEPOIS QUE VOCÊ CLICA EM "BUSCAR"** e os dados são carregados.

### Passo a Passo para Exportar:

#### 1️⃣ **Acesse a Página de Períodos**
```
https://controle-compras-res-d7yzxl.abacusai.app/periodos
```

#### 2️⃣ **Preencha os Filtros (Opcional)**
- **Data Inicial**: Escolha a data de início (ex: 01/11/2025)
- **Data Final**: Escolha a data final (ex: 31/12/2025)
- **Fornecedor**: Digite o nome do fornecedor (opcional)
- **Produto**: Digite o nome do produto (opcional)

💡 **DICA**: Você pode deixar todos os campos vazios e clicar em "Buscar" para ver TODAS as compras!

#### 3️⃣ **Clique no Botão "Buscar"**
Após clicar, você verá:
- ✅ Estatísticas (Total de Compras, Valor Total, Fornecedores, Quantidade)
- ✅ 4 Abas: **Compras | Por Produto | Por Fornecedor | Por Categoria**

#### 4️⃣ **Localize o Botão "Exportar"**
O botão "Exportar" está localizado:
- **Posição**: Canto superior direito de cada aba
- **Ao lado do título**: "Lista de Compras", "Produtos Mais Comprados", "Fornecedores", "Por Categoria"
- **Ícone**: 📥 Download

#### 5️⃣ **Clique no Botão "Exportar"**
Ao clicar, aparecerá um **menu dropdown** com 2 opções:

```
📥 Exportar
   ├── 📊 Exportar Excel (.xlsx)
   └── 📄 Exportar CSV
```

#### 6️⃣ **Escolha o Formato Desejado**
- **Excel (.xlsx)**: Melhor para análises no Excel, formatado com colunas ajustadas
- **CSV**: Melhor para importar em outros sistemas, compatível com qualquer planilha

---

## 📋 Tipos de Exportação por Aba

### 📦 **Aba "Compras"**
**Dados Exportados:**
- Data da Compra
- Fornecedor
- CNPJ
- Produto
- Quantidade
- Preço Unitário
- Preço Total
- Total da Compra

**Nome do Arquivo:**
```
compras_2025-11-01_2025-12-31.xlsx
compras_2025-11-01_2025-12-31.csv
```

**Exemplo de Uso:**
- Enviar para contador
- Análise de gastos mensais
- Auditoria de compras

---

### 🛒 **Aba "Por Produto"**
**Dados Exportados:**
- Nome do Produto
- Categoria
- Quantidade Total Comprada
- Valor Total Gasto
- Preço Médio
- Número de Compras

**Nome do Arquivo:**
```
produtos_2025-11-01_2025-12-31.xlsx
produtos_2025-11-01_2025-12-31.csv
```

**Exemplo de Uso:**
- Identificar produtos mais comprados
- Analisar variação de preços
- Negociar com fornecedores

---

### 🏪 **Aba "Por Fornecedor"**
**Dados Exportados:**
- Nome do Fornecedor
- CNPJ
- Total de Compras
- Total de Itens
- Valor Total

**Nome do Arquivo:**
```
fornecedores_2025-11-01_2025-12-31.xlsx
fornecedores_2025-11-01_2025-12-31.csv
```

**Exemplo de Uso:**
- Avaliar fornecedores mais utilizados
- Negociar descontos por volume
- Diversificar fornecedores

---

### 🎨 **Aba "Por Categoria"**
**Dados Exportados:**
- Nome da Categoria
- Cor da Categoria
- Quantidade de Itens
- Valor Total

**Nome do Arquivo:**
```
categorias_2025-11-01_2025-12-31.xlsx
categorias_2025-11-01_2025-12-31.csv
```

**Exemplo de Uso:**
- Análise de gastos por tipo de produto
- Orçamento por categoria
- Controle de custos

⚠️ **IMPORTANTE**: Como você ainda não criou categorias, verá apenas "Sem categoria". Crie as 11 categorias recomendadas na aba "Categorias" para aproveitar melhor esta funcionalidade!

---

## 🎓 Exemplos Práticos

### Exemplo 1: Exportar Todas as Compras de Novembro
1. Data Inicial: `01/11/2025`
2. Data Final: `30/11/2025`
3. Clique em "Buscar"
4. Aba "Compras" → Clique em "Exportar" → "Exportar Excel (.xlsx)"
5. Arquivo gerado: `compras_2025-11-01_2025-11-30.xlsx`

### Exemplo 2: Exportar Compras de um Fornecedor Específico
1. Fornecedor: `Pão de Açúcar`
2. Deixe as datas vazias (todas as datas)
3. Clique em "Buscar"
4. Aba "Compras" → Clique em "Exportar" → "Exportar CSV"
5. Arquivo gerado: `compras_todos.csv`

### Exemplo 3: Analisar Produtos Mais Comprados
1. Deixe todos os filtros vazios
2. Clique em "Buscar"
3. Aba "Por Produto" → Clique em "Exportar" → "Exportar Excel (.xlsx)"
4. Arquivo gerado: `produtos_todos.xlsx`
5. Abra no Excel e ordene por "Valor Total" decrescente

---

## 🔧 Solução de Problemas

### ❓ "Não consigo ver o botão Exportar"
**Solução**: O botão só aparece DEPOIS de clicar em "Buscar". Certifique-se de:
1. Clicar no botão "Buscar" (mesmo sem preencher filtros)
2. Aguardar os dados carregarem (aparecem as estatísticas)
3. O botão estará no canto superior direito de cada aba

### ❓ "Aparece 'Nenhum dado para exportar'"
**Solução**: Significa que não há dados no período/filtro selecionado:
1. Tente remover os filtros e buscar novamente
2. Verifique se há compras cadastradas no sistema
3. Mude o período de busca

### ❓ "O arquivo não abre no Excel"
**Solução para CSV**:
1. Abra o Excel
2. Vá em "Dados" → "Obter Dados" → "Do Arquivo" → "Do Texto/CSV"
3. Selecione o arquivo CSV baixado
4. Escolha "Delimitador: vírgula" e "Codificação: UTF-8"

**Solução para Excel (.xlsx)**:
1. O arquivo deve abrir normalmente
2. Se der erro, tente fazer o download novamente
3. Certifique-se de ter o Microsoft Excel ou LibreOffice instalado

---

## 📊 Análises Recomendadas

### 1. **Análise de Custos Mensais**
```
Exporte: Compras (com datas do mês)
Abra no Excel → Crie uma Tabela Dinâmica
Linhas: Fornecedor
Valores: Soma de Total da Compra
```

### 2. **Top 10 Produtos Mais Caros**
```
Exporte: Por Produto (sem filtros)
Abra no Excel → Ordene por "Valor Total" decrescente
Selecione os 10 primeiros
```

### 3. **Variação de Preço de um Produto**
```
Exporte: Compras com filtro de Produto
Abra no Excel → Crie um gráfico de linha
Eixo X: Data da Compra
Eixo Y: Preço Unitário
```

### 4. **Fornecedor com Melhor Custo-Benefício**
```
Exporte: Por Fornecedor
Abra no Excel → Compare "Valor Total" vs "Total de Itens"
Calcule: Valor Total / Total de Itens = Custo Médio por Item
```

---

## 🎯 Status Atual do Seu Sistema

### ✅ Dados Cadastrados:
- **42 Compras** registradas
- **R$ 21.877,44** em gastos totais
- **18 Fornecedores** diferentes
- **1.097 Unidades** compradas
- **386 Itens** sem categoria

### ⚠️ Recomendações:
1. **Crie as 11 Categorias** na aba "Categorias" para melhor organização
2. **Exporte os dados mensalmente** para acompanhar tendências
3. **Use os filtros** para análises específicas (fornecedor, produto, período)
4. **Mantenha backups** dos arquivos exportados

---

## 📞 Precisa de Ajuda?

Se ainda tiver dúvidas:
1. Revise este guia novamente
2. Experimente fazer uma busca sem filtros primeiro
3. Verifique se clicou no botão "Buscar" antes de procurar o botão "Exportar"
4. Teste as diferentes abas e formatos de exportação

---

**Documentação atualizada em:** 08/12/2025
**Versão:** 1.0
**Sistema:** Controle Financeiro - Restaurante
**URL:** https://controle-compras-res-d7yzxl.abacusai.app/periodos
