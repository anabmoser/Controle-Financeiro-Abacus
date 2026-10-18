import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadBillFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF, JPG ou PNG.' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Gerar nome único para o arquivo (sem prefixo 'bills/' pois já é adicionado pela função)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Upload para S3 usando função específica para boletos
    const cloudStoragePath = await uploadBillFile(buffer, sanitizedName);

    // Criar registro no banco de dados
    const bill = await prisma.bill.create({
      data: {
        supplierName: 'Aguardando OCR...',
        totalAmount: 0,
        dueDate: new Date(),
        fileUrl: cloudStoragePath,
        fileName: file.name,
        fileSize: BigInt(file.size),
        fileType: file.type,
        ocrStatus: 'pending',
        status: 'pending'
      }
    });

    return NextResponse.json({
      billId: bill.id,
      cloudStoragePath,
      message: 'Arquivo enviado com sucesso. Processando OCR...'
    });
  } catch (error) {
    console.error('Erro no upload do boleto:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}
