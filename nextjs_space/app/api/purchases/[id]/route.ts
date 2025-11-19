
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        purchaseItems: {
          include: {
            category: true,
          },
          orderBy: {
            productName: 'asc',
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Erro ao buscar compra:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar compra' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.purchase.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir compra:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir compra' },
      { status: 500 }
    )
  }
}
