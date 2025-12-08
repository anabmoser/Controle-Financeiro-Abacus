import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '8')

    // Se a query tiver menos de 2 caracteres, retorna os produtos mais comprados
    if (query.length < 2) {
      const topProducts = await prisma.purchaseItem.groupBy({
        by: ['productName'],
        _count: {
          productName: true,
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
        products: topProducts.map((p) => ({
          name: p.productName,
          count: p._count.productName,
        })),
      })
    }

    // Busca produtos que contenham a query (case-insensitive)
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
      orderBy: {
        _count: {
          productName: 'desc',
        },
      },
      take: limit,
    })

    return NextResponse.json({
      query,
      products: products.map((p) => ({
        name: p.productName,
        count: p._count.productName,
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
