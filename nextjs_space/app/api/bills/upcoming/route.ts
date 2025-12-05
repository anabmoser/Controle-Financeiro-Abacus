import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';

// GET - Boletos próximos ao vencimento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const today = new Date();
    const futureDate = addDays(today, days);

    const bills = await prisma.bill.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: today,
          lte: futureDate
        }
      },
      include: {
        supplier: true
      },
      orderBy: { dueDate: 'asc' }
    });

    // Separar por urgência
    const overdue = await prisma.bill.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: today
        }
      },
      include: {
        supplier: true
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json({ 
      upcoming: bills,
      overdue,
      total: bills.length + overdue.length
    });
  } catch (error) {
    console.error('Erro ao buscar boletos próximos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar boletos próximos' },
      { status: 500 }
    );
  }
}
