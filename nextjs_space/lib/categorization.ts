/**
 * Sistema de Categorização Automática via IA
 * Usa LLM da Abacus.AI para categorizar produtos inteligentemente
 */

interface Category {
  id: string
  name: string
}

interface CategorizationResult {
  categoryId: string | null
  categoryName: string | null
  confidence: number
}

/**
 * Categoriza um produto usando IA
 * @param productName - Nome do produto a ser categorizado
 * @param categories - Lista de categorias disponíveis
 * @returns ID da categoria mais apropriada ou null
 */
export async function categorizeProduct(
  productName: string,
  categories: Category[]
): Promise<CategorizationResult> {
  // Se não houver categorias, retorna null
  if (!categories || categories.length === 0) {
    return {
      categoryId: null,
      categoryName: null,
      confidence: 0
    }
  }

  // Se houver apenas uma categoria, usa ela
  if (categories.length === 1) {
    return {
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      confidence: 1.0
    }
  }

  try {
    const apiKey = process.env.ABACUSAI_API_KEY
    if (!apiKey) {
      console.error('ABACUSAI_API_KEY não configurada')
      return { categoryId: null, categoryName: null, confidence: 0 }
    }

    // Prepara lista de categorias para o prompt
    const categoryList = categories
      .map((cat, idx) => `${idx + 1}. ${cat.name}`)
      .join('\n')

    // Prompt otimizado para categorização precisa
    const prompt = `Você é um especialista em categorização de produtos de supermercado e restaurante.

Produto a categorizar: "${productName}"

Categorias disponíveis:
${categoryList}

REGRAS:
1. Analise o nome do produto cuidadosamente
2. Considere abreviações comuns:
   - QJ = Queijo
   - CA = Carne
   - CR = Cream cheese / Requeijão
   - LA = Laticínio
   - FR = Frango
   - SAL = Salsa/Salgado
   - REF = Refrigerante
3. Escolha a categoria MAIS ESPECÍFICA e apropriada
4. Se nenhuma categoria se encaixar perfeitamente, escolha "Outros" se disponível
5. Responda APENAS com o número da categoria (1, 2, 3, etc.)
6. NÃO invente categorias
7. NÃO adicione explicações

RESPONDA APENAS COM O NÚMERO DA CATEGORIA:`

    const response = await fetch('https://api.abacus.ai/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o',
        temperature: 0.0,
        max_tokens: 10
      })
    })

    if (!response.ok) {
      console.error('Erro na API:', await response.text())
      return { categoryId: null, categoryName: null, confidence: 0 }
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content?.trim()

    if (!answer) {
      return { categoryId: null, categoryName: null, confidence: 0 }
    }

    // Extrai o número da resposta
    const categoryIndex = parseInt(answer) - 1

    if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
      console.warn(`Resposta inválida da IA: "${answer}" para produto "${productName}"`)
      return { categoryId: null, categoryName: null, confidence: 0 }
    }

    const selectedCategory = categories[categoryIndex]
    
    return {
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      confidence: 0.95 // Alta confiança quando a IA retorna uma categoria válida
    }

  } catch (error) {
    console.error('Erro ao categorizar produto:', error)
    return { categoryId: null, categoryName: null, confidence: 0 }
  }
}

/**
 * Categoriza múltiplos produtos em lote
 * @param products - Array de nomes de produtos
 * @param categories - Lista de categorias disponíveis
 * @returns Map de nome do produto para ID da categoria
 */
export async function categorizeProducts(
  products: string[],
  categories: Category[]
): Promise<Map<string, CategorizationResult>> {
  const results = new Map<string, CategorizationResult>()

  // Processa produtos em paralelo (máximo 5 por vez para não sobrecarregar a API)
  const batchSize = 5
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const promises = batch.map(product => categorizeProduct(product, categories))
    const batchResults = await Promise.all(promises)
    
    batch.forEach((product, idx) => {
      results.set(product, batchResults[idx])
    })
  }

  return results
}
