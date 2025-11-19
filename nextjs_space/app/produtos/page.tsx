
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite o nome de um produto')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/products/history?productName=${encodeURIComponent(searchTerm)}&limit=100`
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

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Digite o nome do produto (ex: ARROZ, FEIJÃO, ÓLEO...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {data && (
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
