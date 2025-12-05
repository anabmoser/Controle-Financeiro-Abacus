import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Listar boletos com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierName = searchParams.get('supplierName');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (supplierName) {
      where.supplierName = {
        contains: supplierName,
        mode: 'insensitive'
      };
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.dueDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const bills = await prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error('Erro ao buscar boletos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar boletos' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar boleto
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID do boleto é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (data.status) updateData.status = data.status;
    if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.description) updateData.description = data.description;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    const bill = await prisma.bill.update({
      where: { id: data.id },
      data: updateData
    });

    return NextResponse.json({ bill });
  } catch (error) {
    console.error('Erro ao atualizar boleto:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar boleto' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar boleto
export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const id = data.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do boleto é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.bill.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar boleto:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar boleto' },
      { status: 500 }
    );
  }
}
