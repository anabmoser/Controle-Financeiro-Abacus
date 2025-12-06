require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  console.log('\n🔍 === VERIFICAÇÃO COMPLETA DE COMPRAS E PRODUTOS ===\n');

  try {
    // 1. COMPRAS DETALHADAS
    console.log('📦 COMPRAS CADASTRADAS:\n');
    const purchases = await prisma.purchase.findMany({
      include: {
        purchaseItems: {
          include: {
            product: true,
            category: true
          }
        },
        receipt: true
      },
      orderBy: { purchaseDate: 'desc' }
    });

    if (purchases.length === 0) {
      console.log('   ⚠️  Nenhuma compra cadastrada ainda\n');
    } else {
      purchases.forEach((purchase, index) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`COMPRA #${index + 1}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🏢 Fornecedor: ${purchase.supplierName}`);
        if (purchase.supplierCnpj) {
          console.log(`📄 CNPJ: ${purchase.supplierCnpj}`);
        }
        console.log(`📅 Data: ${purchase.purchaseDate.toLocaleDateString('pt-BR')}`);
        console.log(`💰 Total: R$ ${purchase.totalAmount}`);
        if (purchase.invoiceNumber) {
          console.log(`🔢 Nota Fiscal: ${purchase.invoiceNumber}`);
        }
        console.log(`📊 Status: ${purchase.status}`);
        
        if (purchase.receipt) {
          console.log(`\n📎 Recibo:`);
          console.log(`   - Arquivo: ${purchase.receipt.fileName || 'N/A'}`);
          console.log(`   - OCR Status: ${purchase.receipt.ocrStatus}`);
          if (purchase.receipt.ocrConfidence) {
            console.log(`   - Confiança OCR: ${(purchase.receipt.ocrConfidence * 100).toFixed(1)}%`);
          }
        }

        console.log(`\n📋 ITENS DA COMPRA (${purchase.purchaseItems.length}):`);
        console.log('─────────────────────────────────────────────────');
        
        purchase.purchaseItems.forEach((item, itemIndex) => {
          console.log(`\n   ${itemIndex + 1}. ${item.productName}`);
          console.log(`      Quantidade: ${item.quantity} ${item.unit}`);
          console.log(`      Preço Unit: R$ ${item.unitPrice}`);
          console.log(`      Total: R$ ${item.totalPrice}`);
          
          if (item.category) {
            console.log(`      Categoria: ${item.category.name} (${item.category.color})`);
          } else {
            console.log(`      Categoria: ⚠️  Sem categoria`);
          }
          
          if (item.discountAmount > 0) {
            console.log(`      Desconto: R$ ${item.discountAmount}`);
          }
        });
      });
    }

    // 2. RESUMO DE PRODUTOS
    console.log('\n\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 RESUMO DE PRODUTOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const products = await prisma.product.findMany({
      include: {
        category: true,
        purchaseItems: {
          include: {
            purchase: true
          }
        }
      }
    });

    console.log(`Total de produtos únicos: ${products.length}\n`);

    if (products.length > 0) {
      console.log('Produtos cadastrados:\n');
      products.forEach((product, index) => {
        const totalCompras = product.purchaseItems.length;
        const totalQuantidade = product.purchaseItems.reduce((sum, item) => 
          sum + parseFloat(item.quantity), 0
        );

        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Categoria: ${product.category?.name || '⚠️  Sem categoria'}`);
        console.log(`   Marca: ${product.brand || 'N/A'}`);
        console.log(`   Unidade: ${product.unit}`);
        console.log(`   Compras: ${totalCompras}x | Total comprado: ${totalQuantidade.toFixed(2)} ${product.unit}`);
        console.log('');
      });
    }

    // 3. CATEGORIAS
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  CATEGORIAS CADASTRADAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (categories.length === 0) {
      console.log('⚠️  Nenhuma categoria cadastrada ainda');
      console.log('\n💡 DICA: Crie as 11 categorias recomendadas em:');
      console.log('   https://controle-compras-res-d7yzxl.abacusai.app/categorias\n');
    } else {
      categories.forEach(cat => {
        console.log(`• ${cat.name} (${cat.color}) - ${cat._count.products} produtos`);
      });
    }

    // 4. ESTATÍSTICAS GERAIS
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ESTATÍSTICAS GERAIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const stats = {
      compras: await prisma.purchase.count(),
      produtos: await prisma.product.count(),
      categorias: await prisma.category.count(),
      itensCompra: await prisma.purchaseItem.count(),
      recibos: await prisma.receipt.count(),
      boletos: await prisma.bill.count()
    };

    const totalGasto = await prisma.purchase.aggregate({
      _sum: { totalAmount: true }
    });

    const produtosSemCategoria = await prisma.product.count({
      where: { categoryId: null }
    });

    console.log(`Total de Compras: ${stats.compras}`);
    console.log(`Total de Produtos Únicos: ${stats.produtos}`);
    console.log(`Total de Itens Comprados: ${stats.itensCompra}`);
    console.log(`Total de Categorias: ${stats.categorias}`);
    console.log(`Total de Recibos: ${stats.recibos}`);
    console.log(`Total de Boletos: ${stats.boletos}`);
    console.log(`\n💵 Valor Total Gasto: R$ ${totalGasto._sum.totalAmount || 0}`);
    console.log(`⚠️  Produtos sem Categoria: ${produtosSemCategoria}\n`);

    // 5. CONCLUSÃO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICAÇÃO CONCLUÍDA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (stats.compras > 0) {
      console.log('✅ Dados sendo salvos corretamente no Supabase!');
      console.log(`✅ ${stats.compras} compras com ${stats.itensCompra} itens cadastrados`);
      console.log(`✅ ${stats.produtos} produtos únicos no catálogo\n`);
    } else {
      console.log('⚠️  Nenhuma compra cadastrada ainda');
      console.log('💡 Faça upload de um cupom fiscal em:');
      console.log('   https://controle-compras-res-d7yzxl.abacusai.app/upload\n');
    }

  } catch (error) {
    console.error('\n❌ Erro ao verificar dados:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
