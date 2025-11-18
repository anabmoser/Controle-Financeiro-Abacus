
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar categorias padrão
  const categories = [
    { name: 'Hortifruti', color: '#22C55E' },
    { name: 'Carnes e Peixes', color: '#EF4444' },
    { name: 'Laticínios', color: '#60A5FA' },
    { name: 'Grãos e Cereais', color: '#F97316' },
    { name: 'Bebidas', color: '#3B82F6' },
    { name: 'Temperos e Condimentos', color: '#FBBF24' },
    { name: 'Limpeza', color: '#A855F7' },
    { name: 'Descartáveis', color: '#8B5CF6' },
    { name: 'Outros', color: '#6B7280' },
  ]

  for (const category of categories) {
    const exists = await prisma.category.findFirst({
      where: { name: category.name },
    })

    if (!exists) {
      await prisma.category.create({
        data: category,
      })
      console.log(`✅ Categoria criada: ${category.name}`)
    } else {
      console.log(`⏭️  Categoria já existe: ${category.name}`)
    }
  }

  // Criar alguns produtos comuns
  const hortifruti = await prisma.category.findFirst({
    where: { name: 'Hortifruti' },
  })
  const carnes = await prisma.category.findFirst({
    where: { name: 'Carnes e Peixes' },
  })
  const graos = await prisma.category.findFirst({
    where: { name: 'Grãos e Cereais' },
  })

  const products = [
    {
      name: 'Tomate',
      normalizedName: 'tomate',
      categoryId: hortifruti?.id,
      unit: 'kg',
    },
    {
      name: 'Cebola',
      normalizedName: 'cebola',
      categoryId: hortifruti?.id,
      unit: 'kg',
    },
    {
      name: 'Batata',
      normalizedName: 'batata',
      categoryId: hortifruti?.id,
      unit: 'kg',
    },
    {
      name: 'Frango',
      normalizedName: 'frango',
      categoryId: carnes?.id,
      unit: 'kg',
    },
    {
      name: 'Arroz',
      normalizedName: 'arroz',
      categoryId: graos?.id,
      unit: 'kg',
    },
    {
      name: 'Feijão',
      normalizedName: 'feijao',
      categoryId: graos?.id,
      unit: 'kg',
    },
  ]

  for (const product of products) {
    const exists = await prisma.product.findFirst({
      where: { normalizedName: product.normalizedName },
    })

    if (!exists) {
      await prisma.product.create({
        data: product,
      })
      console.log(`✅ Produto criado: ${product.name}`)
    } else {
      console.log(`⏭️  Produto já existe: ${product.name}`)
    }
  }

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
