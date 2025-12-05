import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Listar todos os fornecedores
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { bills: true }
        }
      }
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    );
  }
}

// POST - Criar novo fornecedor
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        cnpj: data.cnpj || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        contactPerson: data.contactPerson || null,
        notes: data.notes || null,
        active: data.active !== undefined ? data.active : true
      }
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro ao criar fornecedor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar fornecedor
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID do fornecedor é obrigatório' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: data.id },
      data: {
        name: data.name,
        cnpj: data.cnpj || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        contactPerson: data.contactPerson || null,
        notes: data.notes || null,
        active: data.active
      }
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar fornecedor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar fornecedor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do fornecedor é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar fornecedor' },
      { status: 500 }
    );
  }
}
