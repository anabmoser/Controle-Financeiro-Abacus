import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './formatters';

/**
 * Exporta dados para arquivo Excel (.xlsx)
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Dados') {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet a partir dos dados
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Ajustar largura das colunas automaticamente
  const cols = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
  }));
  ws['!cols'] = cols;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Gerar arquivo e fazer download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exporta dados para arquivo CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  // Obter cabeçalhos
  const headers = Object.keys(data[0]);
  
  // Criar linhas CSV
  const csvRows = [
    headers.join(','), // Cabeçalho
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar valores com vírgulas ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}`;
        }
        return value;
      }).join(',')
    )
  ];
  
  // Criar blob e download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formata dados de compras para exportação
 */
export function formatComprasParaExportacao(compras: any[]) {
  return compras.flatMap(compra => 
    compra.items.map((item: any, index: number) => ({
      'Data': formatDate(compra.data),
      'Fornecedor': compra.fornecedor,
      'CNPJ': compra.cnpj || 'N/A',
      'Produto': item.nome,
      'Quantidade': item.quantidade,
      'Unidade': item.unidade,
      'Preço Unitário': formatCurrency(item.precoUnitario),
      'Preço Total': formatCurrency(item.precoTotal),
      'Categoria': item.categoria,
      'Total da Compra': index === 0 ? formatCurrency(compra.total) : '',
    }))
  );
}

/**
 * Formata dados de produtos para exportação
 */
export function formatProdutosParaExportacao(produtos: any[]) {
  return produtos.map(produto => ({
    'Produto': produto.nome,
    'Categoria': produto.categoria,
    'Nº de Compras': produto.compras,
    'Quantidade Total': produto.quantidadeTotal.toFixed(2),
    'Valor Total': formatCurrency(produto.valorTotal),
    'Preço Médio': formatCurrency(produto.precoMedio),
  }));
}

/**
 * Formata dados de fornecedores para exportação
 */
export function formatFornecedoresParaExportacao(fornecedores: any[]) {
  return fornecedores.map(fornecedor => ({
    'Fornecedor': fornecedor.nome,
    'CNPJ': fornecedor.cnpj || 'N/A',
    'Nº de Compras': fornecedor.compras,
    'Total de Itens': fornecedor.itensTotal,
    'Valor Total': formatCurrency(fornecedor.valorTotal),
    'Ticket Médio': formatCurrency(fornecedor.valorTotal / fornecedor.compras),
  }));
}

/**
 * Formata dados de categorias para exportação
 */
export function formatCategoriasParaExportacao(categorias: any[]) {
  return categorias.map(categoria => ({
    'Categoria': categoria.nome,
    'Cor': categoria.cor,
    'Nº de Itens': categoria.itens,
    'Valor Total': formatCurrency(categoria.valorTotal),
  }));
}
