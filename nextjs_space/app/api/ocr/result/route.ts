
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const receiptId = searchParams.get('receiptId')

    if (!receiptId) {
      return NextResponse.json({ error: 'receiptId não fornecido' }, { status: 400 })
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt não encontrado' }, { status: 404 })
    }

    return NextResponse.json(receipt.ocrResult || {})
  } catch (error) {
    console.error('Erro ao buscar resultado OCR:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resultado' },
      { status: 500 }
    )
  }
}
