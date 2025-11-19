
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
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import dynamic from 'next/dynamic'

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    loadStats()
  }, [period])

  async function loadStats() {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/stats?period=${period}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input w-48"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
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
