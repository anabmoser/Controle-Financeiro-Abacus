

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const periodDays = parseInt(searchParams.get('period') || '30')

    // Calcular data inicial baseada no período
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Buscar produtos da categoria
    const products = await prisma.product.findMany({
      where: {
        categoryId: params.id,
      },
      include: {
        purchaseItems: {
          where: {
            purchase: {
              purchaseDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          include: {
            purchase: {
              select: {
                purchaseDate: true,
                supplierName: true,
              },
            },
          },
        },
      },
    })

    // Agregar dados dos produtos
    const productDetails = products.map((product) => {
      const items = product.purchaseItems
      const totalQuantity = items.reduce(
        (sum: number, item) => sum + Number(item.quantity),
        0
      )
      const totalValue = items.reduce(
        (sum: number, item) => sum + Number(item.totalPrice),
        0
      )
      const purchases = items.length
      const avgPrice = purchases > 0 ? totalValue / totalQuantity : 0

      // Últimas compras
      const recentPurchases = items
        .sort(
          (a, b) =>
            b.purchase.purchaseDate.getTime() - a.purchase.purchaseDate.getTime()
        )
        .slice(0, 3)
        .map((item) => ({
          date: item.purchase.purchaseDate,
          supplier: item.purchase.supplierName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        }))

      return {
        id: product.id,
        name: product.name,
        totalQuantity,
        totalValue,
        purchases,
        avgPrice,
        recentPurchases,
      }
    })

    // Ordenar por valor total
    productDetails.sort(
      (a: { totalValue: number }, b: { totalValue: number }) =>
        b.totalValue - a.totalValue
    )

    // Calcular totais da categoria
    const categoryTotal = productDetails.reduce(
      (sum: number, p) => sum + p.totalValue,
      0
    )
    const categoryQuantity = productDetails.reduce(
      (sum: number, p) => sum + p.totalQuantity,
      0
    )
    const categoryPurchases = productDetails.reduce(
      (sum: number, p) => sum + p.purchases,
      0
    )

    return NextResponse.json({
      categoryId: params.id,
      period: periodDays,
      totals: {
        value: categoryTotal,
        quantity: categoryQuantity,
        purchases: categoryPurchases,
        products: productDetails.length,
      },
      products: productDetails,
    })
  } catch (error) {
    console.error('Erro ao buscar detalhes da categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes da categoria' },
      { status: 500 }
    )
  }
}
