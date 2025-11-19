
'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { ChevronDown, ChevronRight, Trash2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface PurchaseItem {
  id: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  category?: {
    name: string
    color: string
  }
}

interface PurchaseDetails {
  id: string
  supplierName: string
  supplierCnpj?: string
  purchaseDate: string
  totalAmount: number
  status: string
  purchaseItems: PurchaseItem[]
}

interface Purchase {
  id: string
  supplierName: string
  purchaseDate: string
  totalAmount: number
  status: string
  _count?: {
    purchaseItems: number
  }
}

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<Record<string, PurchaseDetails>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadPurchases()
  }, [])

  async function loadPurchases() {
    try {
      setLoading(true)
      const response = await fetch('/api/purchases')
      const data = await response.json()
      setPurchases(data || [])
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
      toast.error('Erro ao carregar compras')
    } finally {
      setLoading(false)
    }
  }

  async function toggleExpand(purchaseId: string) {
    if (expandedId === purchaseId) {
      setExpandedId(null)
      return
    }

    setExpandedId(purchaseId)

    // Se já temos os detalhes, não precisa buscar novamente
    if (purchaseDetails[purchaseId]) {
      return
    }

    // Buscar detalhes da compra
    try {
      setLoadingDetails((prev) => ({ ...prev, [purchaseId]: true }))
      const response = await fetch(`/api/purchases/${purchaseId}`)
      const data = await response.json()
      setPurchaseDetails((prev) => ({ ...prev, [purchaseId]: data }))
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      toast.error('Erro ao carregar detalhes da compra')
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [purchaseId]: false }))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta compra?')) {
      return
    }

    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir compra')
      }

      toast.success('Compra excluída com sucesso!')
      loadPurchases()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir compra')
    }
  }

  const filteredPurchases = purchases.filter((purchase) =>
    purchase?.supplierName?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '') ?? false
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        </div>

        {/* Busca */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Lista de Compras */}
        <div className="card">
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm
                ? 'Nenhuma compra encontrada'
                : 'Nenhuma compra cadastrada ainda'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPurchases.map((purchase) => {
                    const isExpanded = expandedId === purchase.id
                    const details = purchaseDetails[purchase.id]
                    const isLoadingDetails = loadingDetails[purchase.id]

                    return (
                      <>
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleExpand(purchase.id)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title={isExpanded ? 'Recolher' : 'Expandir'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {purchase?.supplierName || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(purchase?.purchaseDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(purchase?.totalAmount || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {purchase?._count?.purchaseItems || 0} itens
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {purchase?.status || 'completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleDelete(purchase.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-5 w-5 inline" />
                            </button>
                          </td>
                        </tr>
                        
                        {/* Linha expandida com os itens */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              {isLoadingDetails ? (
                                <div className="flex items-center justify-center py-8">
                                  <LoadingSpinner size="md" />
                                </div>
                              ) : details ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      Produtos da Compra
                                    </h3>
                                    {details.supplierCnpj && (
                                      <p className="text-sm text-gray-500">
                                        CNPJ: {details.supplierCnpj}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-white">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Produto
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Categoria
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            Quantidade
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            Preço Unit.
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            Total
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-100">
                                        {details.purchaseItems.map((item) => (
                                          <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                              <div className="text-sm font-medium text-gray-900">
                                                {item.productName}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              {item.category ? (
                                                <Badge 
                                                  variant="outline"
                                                  style={{ 
                                                    borderColor: item.category.color,
                                                    color: item.category.color 
                                                  }}
                                                >
                                                  {item.category.name}
                                                </Badge>
                                              ) : (
                                                <span className="text-sm text-gray-400">
                                                  Sem categoria
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                              <div className="text-sm text-gray-900">
                                                {Number(item.quantity).toFixed(2)} {item.unit}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                              <div className="text-sm text-gray-900">
                                                {formatCurrency(item.unitPrice)}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                              <div className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(item.totalPrice)}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-gray-50">
                                        <tr>
                                          <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                            Total da Compra:
                                          </td>
                                          <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                                            {formatCurrency(details.totalAmount)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  Erro ao carregar detalhes
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
