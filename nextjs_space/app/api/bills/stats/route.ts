import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

// GET - Estatísticas de boletos
export async function GET() {
  try {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    // Total de boletos pendentes
    const pendingCount = await prisma.bill.count({
      where: { status: 'pending' }
    });

    // Total de boletos vencidos
    const overdueCount = await prisma.bill.count({
      where: {
        status: 'pending',
        dueDate: { lt: today }
      }
    });

    // Valor total pendente
    const pendingBills = await prisma.bill.findMany({
      where: { status: 'pending' },
      select: { totalAmount: true }
    });

    const totalPending = pendingBills.reduce(
      (sum: number, bill: { totalAmount: Decimal }) => sum + Number(bill.totalAmount),
      0
    );

    // Valor total pago no mês
    const paidBills = await prisma.bill.findMany({
      where: {
        status: 'paid',
        paymentDate: {
          gte: startMonth,
          lte: endMonth
        }
      },
      select: { totalAmount: true }
    });

    const totalPaidThisMonth = paidBills.reduce(
      (sum: number, bill: { totalAmount: Decimal }) => sum + Number(bill.totalAmount),
      0
    );

    // Valor a vencer no mês
    const dueBills = await prisma.bill.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: startMonth,
          lte: endMonth
        }
      },
      select: { totalAmount: true }
    });

    const totalDueThisMonth = dueBills.reduce(
      (sum: number, bill: { totalAmount: Decimal }) => sum + Number(bill.totalAmount),
      0
    );

    return NextResponse.json({
      pendingCount,
      overdueCount,
      totalPending,
      totalPaidThisMonth,
      totalDueThisMonth
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de boletos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
