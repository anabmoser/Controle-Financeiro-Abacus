import { NextResponse } from 'next/server';

// Este endpoint foi descontinuado
// A funcionalidade de fornecedores foi integrada ao sistema de boletos
export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint descontinuado. Use /api/bills para gerenciar boletos.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint descontinuado. Use /api/bills para gerenciar boletos.' },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Endpoint descontinuado. Use /api/bills para gerenciar boletos.' },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Endpoint descontinuado. Use /api/bills para gerenciar boletos.' },
    { status: 410 }
  );
}
