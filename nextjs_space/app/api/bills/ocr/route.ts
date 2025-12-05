import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';

const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY;

export async function POST(request: Request) {
  try {
    const { billId } = await request.json();

    if (!billId) {
      return NextResponse.json(
        { error: 'ID do boleto não fornecido' },
        { status: 400 }
      );
    }

    // Buscar boleto no banco
    const bill = await prisma.bill.findUnique({
      where: { id: billId }
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Boleto não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status para processando
    await prisma.bill.update({
      where: { id: billId },
      data: { ocrStatus: 'processing' }
    });

    // Obter URL do arquivo
    const fileUrl = await downloadFile(bill.fileUrl);

    // Processar com GPT-4o Vision
    const ocrResult = await processOCR(fileUrl);

    // Atualizar boleto com dados extraídos
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        supplierName: ocrResult.supplierName || 'Fornecedor não identificado',
        supplierCnpj: ocrResult.supplierCnpj,
        billNumber: ocrResult.billNumber,
        barCode: ocrResult.barCode,
        description: ocrResult.description,
        totalAmount: ocrResult.totalAmount || 0,
        dueDate: ocrResult.dueDate ? new Date(ocrResult.dueDate) : new Date(),
        issueDate: ocrResult.issueDate ? new Date(ocrResult.issueDate) : null,
        ocrStatus: 'completed',
        ocrResult: ocrResult as any
      }
    });

    return NextResponse.json({
      success: true,
      bill: updatedBill,
      message: 'OCR processado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro no processamento OCR:', error);

    // Atualizar status de erro
    const { billId } = await request.json();
    if (billId) {
      await prisma.bill.update({
        where: { id: billId },
        data: {
          ocrStatus: 'error',
          ocrError: error.message || 'Erro desconhecido'
        }
      });
    }

    return NextResponse.json(
      { error: 'Erro ao processar OCR', details: error.message },
      { status: 500 }
    );
  }
}

async function processOCR(imageUrl: string) {
  const prompt = `Você é um especialista em extração de dados de boletos bancários brasileiros.

Analise esta imagem de boleto e extraia as seguintes informações:

1. **Nome do Fornecedor/Beneficiário**: Nome completo da empresa que está cobrando
2. **CNPJ**: CNPJ do fornecedor (formato: 00.000.000/0000-00)
3. **Número do Boleto**: Número do documento ou nosso número
4. **Código de Barras**: Linha digitável ou código de barras (47 ou 48 dígitos)
5. **Descrição**: Descrição do serviço/produto (se houver)
6. **Valor Total**: Valor do boleto em reais
7. **Data de Vencimento**: Data de vencimento no formato YYYY-MM-DD
8. **Data de Emissão**: Data de emissão no formato YYYY-MM-DD (se houver)

**REGRAS IMPORTANTES:**
- Se não conseguir identificar algum campo, retorne null
- O valor deve ser um número decimal (ex: 1234.56)
- As datas devem estar no formato ISO (YYYY-MM-DD)
- Não invente informações que não estão visíveis
- Foque nos dados principais: fornecedor, valor e vencimento

Retorne APENAS um objeto JSON válido com esta estrutura:
{
  "supplierName": "string ou null",
  "supplierCnpj": "string ou null",
  "billNumber": "string ou null",
  "barCode": "string ou null",
  "description": "string ou null",
  "totalAmount": número ou null,
  "dueDate": "YYYY-MM-DD ou null",
  "issueDate": "YYYY-MM-DD ou null"
}`;

  try {
    const response = await fetch('https://apis.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.0,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da API');
    }

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair JSON da resposta');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validações básicas
    if (!result.supplierName && !result.totalAmount) {
      throw new Error('Não foi possível extrair dados essenciais do boleto');
    }

    return result;
  } catch (error: any) {
    console.error('Erro no processamento OCR:', error);
    throw new Error(`Falha no OCR: ${error.message}`);
  }
}
