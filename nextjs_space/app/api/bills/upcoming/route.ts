import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

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
      orderBy: { dueDate: 'asc' }
    });

    // Converter BigInt para número antes de serializar
    const serializedUpcoming = bills.map(bill => ({
      ...bill,
      fileSize: bill.fileSize ? Number(bill.fileSize) : null
    }));

    const serializedOverdue = overdue.map(bill => ({
      ...bill,
      fileSize: bill.fileSize ? Number(bill.fileSize) : null
    }));

    return NextResponse.json({ 
      upcoming: serializedUpcoming,
      overdue: serializedOverdue,
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
