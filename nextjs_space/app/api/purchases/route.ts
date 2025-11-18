
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        _count: {
          select: { purchaseItems: true },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Erro ao buscar compras:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar compras' },
      { status: 500 }
    )
  }
}
