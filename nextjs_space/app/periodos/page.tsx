
'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Search, Package, DollarSign, ShoppingCart, Users } from 'lucide-react'
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

export default function PeriodosPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [supplier, setSupplier] = useState('')
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setLoading(true)
    setError('')

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
              <div>
                <label className="text-sm font-medium mb-2 block">Fornecedor (opcional)</label>
                <Input
                  placeholder="Nome do fornecedor"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Produto (opcional)</label>
                <Input
                  placeholder="Nome do produto"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
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
                  <CardHeader>
                    <CardTitle>Lista de Compras</CardTitle>
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
                  <CardHeader>
                    <CardTitle>Produtos Mais Comprados</CardTitle>
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
                  <CardHeader>
                    <CardTitle>Fornecedores</CardTitle>
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
                  <CardHeader>
                    <CardTitle>Por Categoria</CardTitle>
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
