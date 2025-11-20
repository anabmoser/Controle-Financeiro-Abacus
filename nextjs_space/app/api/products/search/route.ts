
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/products/search?q=QJ&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Se não houver query, retornar os produtos mais comprados
    if (!query.trim()) {
      const mostBought = await prisma.purchaseItem.groupBy({
        by: ['productName'],
        _count: {
          productName: true,
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _count: {
            productName: 'desc',
          },
        },
        take: limit,
      })

      return NextResponse.json({
        query: '',
        products: mostBought.map(p => ({
          name: p.productName,
          count: p._count.productName,
          totalQuantity: Number(p._sum.quantity || 0),
        })),
      })
    }

    // Buscar produtos que contêm a query
    const products = await prisma.purchaseItem.groupBy({
      by: ['productName'],
      where: {
        productName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      _count: {
        productName: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          productName: 'desc',
        },
      },
      take: limit,
    })

    return NextResponse.json({
      query,
      products: products.map(p => ({
        name: p.productName,
        count: p._count.productName,
        totalQuantity: Number(p._sum.quantity || 0),
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}
