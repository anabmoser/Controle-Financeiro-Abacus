'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Search, Package, DollarSign, ShoppingCart, Users, FileSpreadsheet, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  exportToExcel,
  exportToCSV,
  formatComprasParaExportacao,
  formatProdutosParaExportacao,
  formatFornecedoresParaExportacao,
  formatCategoriasParaExportacao,
} from '@/lib/export-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function PeriodosPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [supplier, setSupplier] = useState('')
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  
  // Estados para autocomplete
  const [supplierSuggestions, setSupplierSuggestions] = useState<Array<{ name: string; count: number }>>([])
  const [productSuggestions, setProductSuggestions] = useState<Array<{ name: string; count: number }>>([])
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const supplierInputRef = useRef<HTMLDivElement>(null)
  const productInputRef = useRef<HTMLDivElement>(null)

  // Buscar sugestões de fornecedores
  useEffect(() => {
    const fetchSupplierSuggestions = async () => {
      if (supplier.length < 2) {
        setSupplierSuggestions([])
        return
      }

      try {
        const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(supplier)}`)
        const result = await response.json()
        setSupplierSuggestions(result.suppliers || [])
        setShowSupplierDropdown(true)
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error)
        setSupplierSuggestions([])
      }
    }

    const timer = setTimeout(fetchSupplierSuggestions, 300)
    return () => clearTimeout(timer)
  }, [supplier])

  // Buscar sugestões de produtos
  useEffect(() => {
    const fetchProductSuggestions = async () => {
      if (productName.length < 2) {
        setProductSuggestions([])
        return
      }

      try {
        const response = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(productName)}`)
        const result = await response.json()
        setProductSuggestions(result.products || [])
        setShowProductDropdown(true)
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        setProductSuggestions([])
      }
    }

    const timer = setTimeout(fetchProductSuggestions, 300)
    return () => clearTimeout(timer)
  }, [productName])

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierInputRef.current && !supplierInputRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false)
      }
      if (productInputRef.current && !productInputRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    setShowSupplierDropdown(false)
    setShowProductDropdown(false)

    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (supplier) params.append('supplier', supplier)
      if (productName) params.append('productName', productName)

      const response = await fetch(`/api/purchases/by-period?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar compras')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Erro ao buscar dados. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Função para gerar nome de arquivo baseado nos filtros
  const getFileName = (tipo: string) => {
    const periodo = startDate && endDate 
      ? `${startDate}_${endDate}` 
      : startDate 
      ? `desde_${startDate}` 
      : endDate 
      ? `ate_${endDate}`
      : 'todos'
    return `${tipo}_${periodo}`
  }

  // Handlers de exportação
  const handleExportCompras = (format: 'excel' | 'csv') => {
    if (!data || !data.compras || data.compras.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }
    
    const dadosFormatados = formatComprasParaExportacao(data.compras)
    const filename = getFileName('compras')
    
    if (format === 'excel') {
      exportToExcel(dadosFormatados, filename, 'Compras')
    } else {
      exportToCSV(dadosFormatados, filename)
    }
  }

  const handleExportProdutos = (format: 'excel' | 'csv') => {
    if (!data || !data.porProduto || data.porProduto.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }
    
    const dadosFormatados = formatProdutosParaExportacao(data.porProduto)
    const filename = getFileName('produtos')
    
    if (format === 'excel') {
      exportToExcel(dadosFormatados, filename, 'Produtos')
    } else {
      exportToCSV(dadosFormatados, filename)
    }
  }

  const handleExportFornecedores = (format: 'excel' | 'csv') => {
    if (!data || !data.porFornecedor || data.porFornecedor.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }
    
    const dadosFormatados = formatFornecedoresParaExportacao(data.porFornecedor)
    const filename = getFileName('fornecedores')
    
    if (format === 'excel') {
      exportToExcel(dadosFormatados, filename, 'Fornecedores')
    } else {
      exportToCSV(dadosFormatados, filename)
    }
  }

  const handleExportCategorias = (format: 'excel' | 'csv') => {
    if (!data || !data.porCategoria || data.porCategoria.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }
    
    const dadosFormatados = formatCategoriasParaExportacao(data.porCategoria)
    const filename = getFileName('categorias')
    
    if (format === 'excel') {
      exportToExcel(dadosFormatados, filename, 'Categorias')
    } else {
      exportToCSV(dadosFormatados, filename)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Consulta por Período</h1>
          <p className="text-muted-foreground">
            Filtre compras por data, fornecedor ou produto
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div ref={supplierInputRef} className="relative">
                <label className="text-sm font-medium mb-2 block">Fornecedor (opcional)</label>
                <Input
                  placeholder="Digite para buscar fornecedor..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  onFocus={() => supplier.length >= 2 && setShowSupplierDropdown(true)}
                />
                {showSupplierDropdown && supplierSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {supplierSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center"
                        onClick={() => {
                          setSupplier(s.name)
                          setShowSupplierDropdown(false)
                        }}
                      >
                        <span className="truncate">{s.name}</span>
                        <Badge variant="secondary" className="ml-2">{s.count}×</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div ref={productInputRef} className="relative">
                <label className="text-sm font-medium mb-2 block">Produto (opcional)</label>
                <Input
                  placeholder="Digite para buscar produto..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  onFocus={() => productName.length >= 2 && setShowProductDropdown(true)}
                />
                {showProductDropdown && productSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {productSuggestions.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center"
                        onClick={() => {
                          setProductName(p.name)
                          setShowProductDropdown(false)
                        }}
                      >
                        <span className="truncate">{p.name}</span>
                        <Badge variant="secondary" className="ml-2">{p.count}×</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {data && (
          <>
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.totalCompras}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.stats.totalItens} itens
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.stats.valorTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gasto no período
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.fornecedores}</div>
                  <p className="text-xs text-muted-foreground">
                    Diferentes fornecedores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quantidade</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.stats.quantidadeTotal.toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unidades compradas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="compras" className="space-y-4">
              <TabsList>
                <TabsTrigger value="compras">Compras</TabsTrigger>
                <TabsTrigger value="produtos">Por Produto</TabsTrigger>
                <TabsTrigger value="fornecedores">Por Fornecedor</TabsTrigger>
                <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
              </TabsList>

              {/* Compras Tab */}
              <TabsContent value="compras">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lista de Compras</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportCompras('excel')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportCompras('csv')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.compras.map((compra: any) => (
                        <div key={compra.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{compra.fornecedor}</p>
                              <p className="text-sm text-muted-foreground">{compra.cnpj}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(compra.data)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{formatCurrency(compra.total)}</p>
                              <p className="text-sm text-muted-foreground">{compra.itens} itens</p>
                            </div>
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-primary hover:underline">
                              Ver itens
                            </summary>
                            <div className="mt-2 space-y-1">
                              {compra.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm py-1 border-t">
                                  <span>{item.nome}</span>
                                  <span>
                                    {item.quantidade} {item.unidade} × {formatCurrency(item.precoUnitario)} = {formatCurrency(item.precoTotal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Produtos Tab */}
              <TabsContent value="produtos">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Produtos Mais Comprados</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportProdutos('excel')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportProdutos('csv')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Compras</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Preço Médio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.porProduto.map((produto: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{produto.categoria}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{produto.compras}</TableCell>
                            <TableCell className="text-right">
                              {produto.quantidadeTotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(produto.valorTotal)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(produto.precoMedio)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fornecedores Tab */}
              <TabsContent value="fornecedores">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Fornecedores</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportFornecedores('excel')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportFornecedores('csv')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead className="text-right">Compras</TableHead>
                          <TableHead className="text-right">Itens</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.porFornecedor.map((fornecedor: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {fornecedor.cnpj || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{fornecedor.compras}</TableCell>
                            <TableCell className="text-right">{fornecedor.itensTotal}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(fornecedor.valorTotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categorias Tab */}
              <TabsContent value="categorias">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Por Categoria</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportCategorias('excel')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar Excel (.xlsx)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportCategorias('csv')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.porCategoria.map((categoria: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoria.cor }}
                            />
                            <div>
                              <p className="font-medium">{categoria.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {categoria.itens} itens
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold">
                            {formatCurrency(categoria.valorTotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Empty State */}
        {!data && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma consulta realizada</h3>
              <p className="text-muted-foreground">
                Use os filtros acima para consultar compras por período
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
