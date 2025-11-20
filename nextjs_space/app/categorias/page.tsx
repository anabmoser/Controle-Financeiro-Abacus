
'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Plus, Edit2, Trash2, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/formatters'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Category {
  id: string
  name: string
  color: string
  _count?: {
    products: number
  }
}

interface CategoryDetails {
  categoryId: string
  period: number
  totals: {
    value: number
    quantity: number
    purchases: number
    products: number
  }
  products: Array<{
    id: string
    name: string
    totalQuantity: number
    totalValue: number
    purchases: number
    avgPrice: number
    recentPurchases: Array<{
      date: Date
      supplier: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }>
  }>
}

type PeriodType = 'current_month' | 'last_month' | '7' | 'custom'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' })
  const [period, setPeriod] = useState<PeriodType>('current_month')
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryDetails()
    }
  }, [selectedCategory, period, customDateRange])

  function calculatePeriodDays(): string {
    const now = new Date()
    
    if (period === 'current_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const diffTime = Math.abs(now.getTime() - startOfMonth.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays.toString()
    } else if (period === 'last_month') {
      return '30'
    } else if (period === '7') {
      return '7'
    } else if (period === 'custom' && customDateRange.from && customDateRange.to) {
      const diffTime = Math.abs(customDateRange.to.getTime() - customDateRange.from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays.toString()
    }
    
    return '30'
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

  async function loadCategories() {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  async function loadCategoryDetails() {
    if (!selectedCategory) return
    
    try {
      setLoadingDetails(true)
      const periodDays = calculatePeriodDays()
      const response = await fetch(
        `/api/categories/${selectedCategory.id}/details?period=${periodDays}`
      )
      const data = await response.json()
      setCategoryDetails(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      toast.error('Erro ao carregar detalhes da categoria')
    } finally {
      setLoadingDetails(false)
    }
  }

  function openCategoryDetails(category: Category) {
    setSelectedCategory(category)
    setShowDetailsModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar categoria')
      }

      toast.success(
        editingCategory
          ? 'Categoria atualizada com sucesso!'
          : 'Categoria criada com sucesso!'
      )
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', color: '#3B82F6' })
      loadCategories()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar categoria')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir categoria')
      }

      toast.success('Categoria excluída com sucesso!')
      loadCategories()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir categoria')
    }
  }

  function openEditModal(category: Category) {
    setEditingCategory(category)
    setFormData({ name: category.name, color: category.color })
    setShowModal(true)
  }

  function openCreateModal() {
    setEditingCategory(null)
    setFormData({ name: '', color: '#3B82F6' })
    setShowModal(true)
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
          
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

            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Nova Categoria
            </button>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openCategoryDetails(category)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: category?.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {category?.name || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category?._count?.products || 0} produtos
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex space-x-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(category)
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(category.id)
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Criar/Editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Cor</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="h-10 w-20 rounded"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="input flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn btn-primary flex-1">
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detalhes da Categoria */}
        {showDetailsModal && selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-lg"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {getPeriodLabel()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedCategory(null)
                    setCategoryDetails(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : categoryDetails ? (
                  <div className="space-y-6">
                    {/* Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card">
                        <p className="text-sm text-gray-500">Valor Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(categoryDetails.totals.value)}
                        </p>
                      </div>
                      <div className="card">
                        <p className="text-sm text-gray-500">Quantidade</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {categoryDetails.totals.quantity.toFixed(1)}
                        </p>
                      </div>
                      <div className="card">
                        <p className="text-sm text-gray-500">Compras</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {categoryDetails.totals.purchases}
                        </p>
                      </div>
                      <div className="card">
                        <p className="text-sm text-gray-500">Produtos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {categoryDetails.totals.products}
                        </p>
                      </div>
                    </div>

                    {/* Lista de Produtos */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Produtos no Período
                      </h3>
                      {categoryDetails.products.length > 0 ? (
                        <div className="space-y-4">
                          {categoryDetails.products.map((product) => (
                            <div key={product.id} className="card">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {product.name}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {product.purchases} compras • Média: {formatCurrency(product.avgPrice)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(product.totalValue)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {product.totalQuantity.toFixed(2)} unidades
                                  </p>
                                </div>
                              </div>

                              {/* Últimas Compras */}
                              {product.recentPurchases.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs font-medium text-gray-500 mb-2">
                                    Últimas compras:
                                  </p>
                                  <div className="space-y-1">
                                    {product.recentPurchases.map((purchase, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <span className="text-gray-600">
                                          {new Date(purchase.date).toLocaleDateString('pt-BR')} • {purchase.supplier}
                                        </span>
                                        <span className="text-gray-900 font-medium">
                                          {purchase.quantity.toFixed(2)}x {formatCurrency(purchase.unitPrice)} = {formatCurrency(purchase.totalPrice)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          Nenhum produto comprado neste período
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Erro ao carregar detalhes
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
