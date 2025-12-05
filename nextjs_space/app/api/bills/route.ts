import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

// GET - Listar boletos com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
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
      include: {
        supplier: true
      },
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

// POST - Criar novo boleto
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const supplierId = formData.get('supplierId') as string;
    const description = formData.get('description') as string;
    const totalAmount = parseFloat(formData.get('totalAmount') as string);
    const installments = parseInt(formData.get('installments') as string) || 1;
    const dueDate = new Date(formData.get('dueDate') as string);
    const issueDate = formData.get('issueDate') ? new Date(formData.get('issueDate') as string) : null;
    const billNumber = formData.get('billNumber') as string || null;
    const notes = formData.get('notes') as string || null;
    const file = formData.get('file') as File | null;

    // Validações
    if (!supplierId || !description || !totalAmount || !dueDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Upload do arquivo se existir
    let fileUrl = null;
    let fileName = null;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      fileUrl = await uploadFile(buffer, file.name);
      fileName = file.name;
    }

    // Calcular valor da parcela
    const installmentAmount = totalAmount / installments;

    const bill = await prisma.bill.create({
      data: {
        supplierId,
        description,
        totalAmount,
        installments,
        currentInstallment: 1,
        installmentAmount,
        dueDate,
        issueDate,
        billNumber,
        notes,
        fileUrl,
        fileName,
        status: 'pending'
      },
      include: {
        supplier: true
      }
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar boleto' },
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
      data: updateData,
      include: {
        supplier: true
      }
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
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
