
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

type PeriodType = 'current_month' | 'last_month' | '7' | 'custom'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('current_month')
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadStats()
  }, [period, customDateRange])

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
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4 space-y-4">
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
