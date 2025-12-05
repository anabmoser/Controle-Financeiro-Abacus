
'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { StatCard } from '@/components/ui/stat-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  FileText,
  Building2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import dynamic from 'next/dynamic'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PieChart = dynamic(
  () => import('@/components/charts/pie-chart').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
)

const LineChart = dynamic(
  () => import('@/components/charts/line-chart').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
)

interface DashboardStats {
  totalGasto: number
  numCompras: number
  ticketMedio: number
  gastosPorCategoria: Array<{ name: string; value: number; color: string }>
  evolucaoMensal: Array<{ month: string; value: number }>
}

interface Bill {
  id: string
  description: string
  installmentAmount: number
  dueDate: string
  supplier: {
    name: string
  }
}

interface BillsData {
  upcoming: Bill[]
  overdue: Bill[]
  total: number
}

type PeriodType = 'current_month' | 'last_month' | '7' | 'custom'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [bills, setBills] = useState<BillsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('current_month')
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadStats()
    loadBills()
  }, [period, customDateRange])

  async function loadBills() {
    try {
      const response = await fetch('/api/bills/upcoming?days=7')
      const data = await response.json()
      setBills(data)
    } catch (error) {
      console.error('Erro ao carregar boletos:', error)
    }
  }

  function calculatePeriodDays(): string {
    const now = new Date()
    
    if (period === 'current_month') {
      // Primeiro dia do mês atual
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const diffTime = Math.abs(now.getTime() - startOfMonth.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays.toString()
    } else if (period === 'last_month') {
      // Mês passado completo (30 dias aproximado)
      return '30'
    } else if (period === '7') {
      return '7'
    } else if (period === 'custom' && customDateRange.from && customDateRange.to) {
      const diffTime = Math.abs(customDateRange.to.getTime() - customDateRange.from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays.toString()
    }
    
    return '30' // fallback
  }

  async function loadStats() {
    try {
      setLoading(true)
      const periodDays = calculatePeriodDays()
      const response = await fetch(`/api/dashboard/stats?period=${periodDays}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  function getPeriodLabel(): string {
    if (period === 'current_month') return 'Este mês'
    if (period === 'last_month') return 'Mês passado'
    if (period === '7') return 'Últimos 7 dias'
    if (period === 'custom' && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(customDateRange.to, 'dd/MM/yy', { locale: ptBR })}`
    }
    return 'Personalizado'
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          
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

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Gasto Total"
            value={formatCurrency(stats?.totalGasto || 0)}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Número de Compras"
            value={stats?.numCompras?.toString() || '0'}
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(stats?.ticketMedio || 0)}
            icon={TrendingUp}
            color="orange"
          />
          <StatCard
            title="Produtos Cadastrados"
            value="15"
            icon={Package}
            color="purple"
          />
        </div>

        {/* Alertas de Boletos */}
        {bills && (bills.overdue.length > 0 || bills.upcoming.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Boletos Vencidos */}
            {bills.overdue.length > 0 && (
              <div className="card border-l-4 border-red-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Boletos Vencidos
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bills.overdue.length} boleto{bills.overdue.length > 1 ? 's' : ''} vencido{bills.overdue.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {bills.overdue.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {bill.description}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <Building2 className="w-4 h-4" />
                            {bill.supplier.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-red-600 dark:text-red-400">
                            <CalendarIcon className="w-4 h-4" />
                            Venceu em {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(Number(bill.installmentAmount))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => window.location.href = '/boletos'}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Ver Todos os Boletos
                  </Button>
                </div>
              </div>
            )}

            {/* Boletos Próximos ao Vencimento */}
            {bills.upcoming.length > 0 && (
              <div className="card border-l-4 border-yellow-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Próximos a Vencer
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Próximos 7 dias
                    </p>
                  </div>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {bills.upcoming.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {bill.description}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <Building2 className="w-4 h-4" />
                            {bill.supplier.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                            <CalendarIcon className="w-4 h-4" />
                            Vence em {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(Number(bill.installmentAmount))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => window.location.href = '/boletos'}
                    variant="outline"
                    className="w-full"
                  >
                    Ver Todos os Boletos
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gastos por Categoria */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Gastos por Categoria
            </h2>
            {stats?.gastosPorCategoria && stats.gastosPorCategoria.length > 0 ? (
              <PieChart data={stats.gastosPorCategoria} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>

          {/* Evolução Mensal */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Evolução de Gastos
            </h2>
            {stats?.evolucaoMensal && stats.evolucaoMensal.length > 0 ? (
              <LineChart data={stats.evolucaoMensal} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Compras Recentes */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Compras Recentes
          </h2>
          <div className="text-center py-8 text-gray-500">
            Funcionalidade em desenvolvimento
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
