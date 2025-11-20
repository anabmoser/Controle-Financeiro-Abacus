
'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ProdutosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ name: string; count: number }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mostBought, setMostBought] = useState<Array<{ name: string; count: number }>>([])

  // Carregar produtos mais comprados ao montar o componente
  useEffect(() => {
    fetch('/api/products/search')
      .then(res => res.json())
      .then(result => {
        setMostBought(result.products || [])
      })
      .catch(err => console.error('Erro ao carregar produtos mais comprados:', err))
  }, [])

  // Autocomplete - buscar sugestões enquanto digita
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}&limit=8`)
          .then(res => res.json())
          .then(result => {
            setSuggestions(result.products || [])
            setShowSuggestions(true)
          })
          .catch(err => console.error('Erro ao buscar sugestões:', err))
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  const handleSearch = async (term?: string) => {
    const searchValue = term || searchTerm
    if (!searchValue.trim()) {
      setError('Digite o nome de um produto')
      return
    }

    setLoading(true)
    setError('')
    setShowSuggestions(false)

    try {
      const response = await fetch(
        `/api/products/history?productName=${encodeURIComponent(searchValue)}&limit=100`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao buscar histórico do produto')
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

  const selectSuggestion = (name: string) => {
    setSearchTerm(name)
    setShowSuggestions(false)
    handleSearch(name)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Consulta por Produto</h1>
          <p className="text-muted-foreground">
            Veja o histórico completo de preços, fornecedores e quantidades
          </p>
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Como funciona a busca:
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Os produtos são salvos com os <strong>nomes abreviados</strong> do cupom fiscal.
                Por exemplo: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">QJ PARRI PED NOAL</span> = Queijo Parmesão Pedaços Noal
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Digite a abreviação: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">QJ</span> (queijo), 
                <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded ml-1">CR</span> (creme), 
                <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded ml-1">LA</span> (lã/limpeza),
                <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded ml-1">SAL</span>, 
                <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded ml-1">AGUA</span>, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="Digite a abreviação do produto (ex: QJ, CR, SAL, LA, AGUA...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-4 py-2 hover:bg-muted flex justify-between items-center"
                        onClick={() => selectSuggestion(suggestion.name)}
                      >
                        <span className="font-medium">{suggestion.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.count}x comprado
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => handleSearch()} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Produtos Mais Comprados - Mostrar quando não há busca ativa */}
        {!data && !loading && mostBought.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produtos Mais Comprados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Clique em um produto para ver seu histórico
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {mostBought.map((product, idx) => (
                  <button
                    key={idx}
                    className="text-left px-4 py-3 border rounded-lg hover:bg-muted transition-colors flex justify-between items-center"
                    onClick={() => selectSuggestion(product.name)}
                  >
                    <span className="font-mono font-medium">{product.name}</span>
                    <Badge variant="outline">{product.count}x</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results - Show Suggestions */}
        {data && data.stats.totalCompras === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum resultado encontrado para "{data.productName}"</CardTitle>
              <p className="text-sm text-muted-foreground">
                Produto não encontrado no histórico. Tente pesquisar com as abreviações do cupom fiscal.
              </p>
            </CardHeader>
            <CardContent>
              {data.suggestions && data.suggestions.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium">Produtos disponíveis no sistema:</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {data.suggestions.map((suggestion: string, idx: number) => (
                      <button
                        key={idx}
                        className="text-left px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <span className="font-mono font-medium">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {data && data.stats.totalCompras > 0 && (
          <>
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.stats.totalCompras}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.stats.quantidadeTotal.toFixed(2)} unidades
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
                    Gasto total no período
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.stats.precoMedio)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Por unidade
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Variação de Preço</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.stats.precoMinimo)} - {formatCurrency(data.stats.precoMaximo)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo e máximo
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Suppliers Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Fornecedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.porFornecedor.map((fornecedor: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{fornecedor.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {fornecedor.cnpj || 'CNPJ não informado'}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-lg">
                          {formatCurrency(fornecedor.precoMedio)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {fornecedor.compras} compras · {fornecedor.quantidadeTotal.toFixed(2)} un
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Purchase History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Categoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.data)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.produto}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.fornecedor}</p>
                            {item.cnpj && (
                              <p className="text-xs text-muted-foreground">{item.cnpj}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantidade} {item.unidade}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.precoUnitario)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.precoTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.categoria}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!data && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma busca realizada</h3>
              <p className="text-muted-foreground">
                Digite o nome de um produto para ver seu histórico completo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
