import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '8')

    // Se a query tiver menos de 2 caracteres, retorna os fornecedores mais usados
    if (query.length < 2) {
      const topSuppliers = await prisma.purchase.groupBy({
        by: ['supplierName'],
        _count: {
          supplierName: true,
        },
        orderBy: {
          _count: {
            supplierName: 'desc',
          },
        },
        take: limit,
      })

      return NextResponse.json({
        query: '',
        suppliers: topSuppliers.map((s) => ({
          name: s.supplierName,
          count: s._count.supplierName,
        })),
      })
    }

    // Busca fornecedores que contenham a query (case-insensitive)
    const suppliers = await prisma.purchase.groupBy({
      by: ['supplierName'],
      where: {
        supplierName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      _count: {
        supplierName: true,
      },
      orderBy: {
        _count: {
          supplierName: 'desc',
        },
      },
      take: limit,
    })

    return NextResponse.json({
      query,
      suppliers: suppliers.map((s) => ({
        name: s.supplierName,
        count: s._count.supplierName,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    )
  }
}
