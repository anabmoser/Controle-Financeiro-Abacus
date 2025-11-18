
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = parseInt(searchParams.get('period') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Total gasto
    const purchases = await prisma.purchase.findMany({
      where: {
        purchaseDate: {
          gte: startDate,
        },
      },
      include: {
        purchaseItems: {
          include: {
            category: true,
          },
        },
      },
    })

    const totalGasto = purchases.reduce(
      (sum, p) => sum + Number(p?.totalAmount || 0),
      0
    )
    const numCompras = purchases.length
    const ticketMedio = numCompras > 0 ? totalGasto / numCompras : 0

    // Gastos por categoria
    const categoriesMap = new Map<
      string,
      { name: string; value: number; color: string }
    >()

    purchases.forEach((purchase) => {
      purchase?.purchaseItems?.forEach((item) => {
        if (item?.category) {
          const current = categoriesMap.get(item.category.id) || {
            name: item.category.name,
            value: 0,
            color: item.category.color,
          }
          current.value += Number(item?.totalPrice || 0)
          categoriesMap.set(item.category.id, current)
        }
      })
    })

    const gastosPorCategoria = Array.from(categoriesMap.values())

    // Evolução mensal (últimos 6 meses)
    const evolucaoMensal = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      )
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      )

      const monthPurchases = await prisma.purchase.findMany({
        where: {
          purchaseDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      const monthTotal = monthPurchases.reduce(
        (sum, p) => sum + Number(p?.totalAmount || 0),
        0
      )

      evolucaoMensal.push({
        month: monthDate.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        value: monthTotal,
      })
    }

    return NextResponse.json({
      totalGasto,
      numCompras,
      ticketMedio,
      gastosPorCategoria,
      evolucaoMensal,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
