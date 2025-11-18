
'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { BarChart3 } from 'lucide-react'

export default function RelatoriosPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>

        <div className="card text-center py-20">
          <BarChart3 className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Em Desenvolvimento
          </h2>
          <p className="text-gray-500">
            Esta funcionalidade estará disponível em breve
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
