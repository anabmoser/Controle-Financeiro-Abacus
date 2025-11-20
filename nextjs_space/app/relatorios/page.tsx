
'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar as CalendarIcon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type PeriodType = 'current_month' | 'last_month' | '7' | 'custom'

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<PeriodType>('current_month')
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [compare, setCompare] = useState(true)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  
  // Convert new period type to old API format
  function getApiPeriodType(): 'week' | 'month' | 'year' {
    if (period === '7') return 'week'
    if (period === 'current_month' || period === 'last_month' || period === 'custom') return 'month'
    return 'month'
  }

  useEffect(() => {
    fetchReport()
  }, [period, compare, customDateRange])

  function getPeriodLabel(): string {
    if (period === 'current_month') return 'Este mês'
    if (period === 'last_month') return 'Mês passado'
    if (period === '7') return 'Últimos 7 dias'
    if (period === 'custom' && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(customDateRange.to, 'dd/MM/yy', { locale: ptBR })}`
    }
    return 'Personalizado'
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const apiPeriod = getApiPeriodType()
      const response = await fetch(
        `/api/reports/summary?type=${apiPeriod}&compare=${compare}`
      )
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erro ao buscar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderVariation = (value: number) => {
    if (!value) return null
    const isPositive = value > 0
    return (
      <Badge variant={isPositive ? 'default' : 'destructive'} className="ml-2">
        {isPositive ? '+' : ''}{value.toFixed(1)}%
        {isPositive ? <TrendingUp className="ml-1 h-3 w-3" /> : <TrendingDown className="ml-1 h-3 w-3" />}
      </Badge>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">
              Análises e comparativos de períodos
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => {
                const newPeriod = e.target.value as PeriodType
                setPeriod(newPeriod)
                if (newPeriod !== 'custom') {
                  setCustomDateRange({})
                  setShowCalendar(false)
                }
              }}
              className="input w-48"
            >
              <option value="current_month">Este mês</option>
              <option value="last_month">Mês passado</option>
              <option value="7">Últimos 7 dias</option>
              <option value="custom">Personalizado</option>
            </select>

            {period === 'custom' && (
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {getPeriodLabel()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-950 opacity-100" align="end">
                  <div className="p-4 space-y-4 bg-white dark:bg-gray-950">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                      <Calendar
                        mode="single"
                        selected={customDateRange.from}
                        onSelect={(date) => {
                          setCustomDateRange(prev => ({ ...prev, from: date }))
                        }}
                        locale={ptBR}
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Final</label>
                      <Calendar
                        mode="single"
                        selected={customDateRange.to}
                        onSelect={(date) => {
                          setCustomDateRange(prev => ({ ...prev, to: date }))
                          if (date) {
                            setShowCalendar(false)
                          }
                        }}
                        locale={ptBR}
                        disabled={(date) => 
                          date > new Date() || 
                          (customDateRange.from ? date < customDateRange.from : false)
                        }
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Carregando relatório...</p>
            </CardContent>
          </Card>
        )}

        {!loading && data && (
          <>
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.dados.totalCompras}
                    {data.comparacao && renderVariation(data.comparacao.compras.variacao)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.dados.totalItens} itens diferentes
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
                    {formatCurrency(data.dados.totalValor)}
                    {data.comparacao && renderVariation(data.comparacao.valor.variacao)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gasto no período
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.dados.ticketMedio)}
                    {data.comparacao && renderVariation(data.comparacao.ticketMedio.variacao)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Por compra
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.dados.totalQuantidade.toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unidades compradas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Card */}
            {data.comparacao && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparação com Período Anterior</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Compras</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{data.comparacao.compras.atual}</p>
                        <p className="text-sm text-muted-foreground">vs {data.comparacao.compras.anterior}</p>
                      </div>
                      {renderVariation(data.comparacao.compras.variacao)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{formatCurrency(data.comparacao.valor.atual)}</p>
                        <p className="text-sm text-muted-foreground">vs {formatCurrency(data.comparacao.valor.anterior)}</p>
                      </div>
                      {renderVariation(data.comparacao.valor.variacao)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{formatCurrency(data.comparacao.ticketMedio.atual)}</p>
                        <p className="text-sm text-muted-foreground">vs {formatCurrency(data.comparacao.ticketMedio.anterior)}</p>
                      </div>
                      {renderVariation(data.comparacao.ticketMedio.variacao)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="produtos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="produtos">Top Produtos</TabsTrigger>
                <TabsTrigger value="fornecedores">Top Fornecedores</TabsTrigger>
                <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
              </TabsList>

              {/* Top Produtos */}
              <TabsContent value="produtos">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Produtos Mais Comprados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Posição</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Compras</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.dados.topProdutos.map((produto: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-bold">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell className="text-right">{produto.compras}</TableCell>
                            <TableCell className="text-right">
                              {produto.quantidade.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(produto.valorTotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Top Fornecedores */}
              <TabsContent value="fornecedores">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Fornecedores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Posição</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead className="text-right">Compras</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.dados.topFornecedores.map((fornecedor: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-bold">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {fornecedor.cnpj || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{fornecedor.compras}</TableCell>
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

              {/* Por Categoria */}
              <TabsContent value="categorias">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.dados.porCategoria.map((categoria: any, index: number) => {
                        const percentage = (categoria.valorTotal / data.dados.totalValor) * 100
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: categoria.cor }}
                                />
                                <span className="font-medium">{categoria.nome}</span>
                                <Badge variant="outline">{categoria.itens} itens</Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(categoria.valorTotal)}</p>
                                <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: categoria.cor,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  )
}
