
'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Send, CheckCircle2, RefreshCw, Edit2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/formatters'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function ChatValidacaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const receiptId = searchParams?.get('receiptId')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [ocrData, setOcrData] = useState<any>(null)
  const [editedData, setEditedData] = useState<any>(null) // Dados após correções
  const [extracting, setExtracting] = useState(false)
  const [corrections, setCorrections] = useState<string[]>([])
  const [showDataPanel, setShowDataPanel] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (receiptId) {
      loadOcrData()
    }
  }, [receiptId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadOcrData() {
    try {
      const response = await fetch(`/api/ocr/result?receiptId=${receiptId}`)
      const data = await response.json()
      setOcrData(data)

      // Iniciar conversa com IA
      await startChat(data)
    } catch (error) {
      console.error('Erro ao carregar dados OCR:', error)
      toast.error('Erro ao carregar dados do documento')
    } finally {
      setInitialLoading(false)
    }
  }

  async function startChat(data: any) {
    try {
      const response = await fetch('/api/chat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrData: data,
          action: 'start',
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  aiMessage += parsed.content
                  setMessages([
                    { role: 'assistant', content: aiMessage },
                  ])
                }
              } catch (e) {
                // Ignorar erros de parsing
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar chat:', error)
      toast.error('Erro ao iniciar validação')
    }
  }

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          ocrData,
          action: 'continue',
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  aiMessage += parsed.content
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage?.role === 'assistant') {
                      lastMessage.content = aiMessage
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: aiMessage,
                      })
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // Ignorar erros de parsing
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao processar mensagem')
    } finally {
      setLoading(false)
    }
  }

  async function extractCorrectionsFromChat() {
    if (messages.length < 2) {
      toast.error('Converse com o chat antes de extrair correções')
      return
    }

    setExtracting(true)
    try {
      const response = await fetch('/api/chat/extract-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          ocrData,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao extrair correções')
      }

      const data = await response.json()
      
      if (data.correctedData) {
        setEditedData(data.correctedData)
        setCorrections(data.correctedData.corrections || [])
        
        if (data.correctedData.corrections && data.correctedData.corrections.length > 0) {
          toast.success(`${data.correctedData.corrections.length} correção(ões) aplicada(s)!`)
        } else {
          toast.success('Nenhuma correção detectada - dados originais mantidos')
        }
      }
    } catch (error) {
      console.error('Erro ao extrair correções:', error)
      toast.error('Erro ao processar correções')
    } finally {
      setExtracting(false)
    }
  }

  async function handleConfirmAndSave() {
    // Usar dados editados se existirem, senão usar dados originais
    const dataToSave = editedData || ocrData

    if (!dataToSave) {
      toast.error('Nenhum dado para salvar')
      return
    }

    try {
      const response = await fetch('/api/purchases/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId,
          ocrData: dataToSave,
          messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar compra')
      }

      const data = await response.json()
      toast.success('Compra salva com sucesso!')
      router.push('/compras')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar compra')
    }
  }

  if (initialLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  const dataToDisplay = editedData || ocrData

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Validação com IA
          </h1>
          
          {corrections.length > 0 && (
            <div className="text-sm text-green-600 font-medium">
              ✅ {corrections.length} correção(ões) aplicada(s)
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Chat */}
          <div className="lg:col-span-2">
            <div className="card h-[700px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4 space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="input flex-1"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="btn btn-primary"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={extractCorrectionsFromChat}
                    disabled={extracting || messages.length < 2}
                    variant="outline"
                    className="w-full"
                  >
                    {extracting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Extraindo...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Aplicar Correções
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleConfirmAndSave}
                    disabled={!dataToDisplay}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar e Salvar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Dados */}
          <div className="lg:col-span-1">
            <div className="card h-[700px] flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Dados Extraídos
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editedData ? 'Com correções aplicadas' : 'Dados originais do OCR'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {dataToDisplay ? (
                  <>
                    {/* Informações Básicas */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Fornecedor</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {dataToDisplay.supplierName || 'Não informado'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">CNPJ</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {dataToDisplay.supplierCnpj || 'Não informado'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">Data</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {dataToDisplay.purchaseDate || 'Não informado'}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">Total</label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatCurrency(dataToDisplay.totalAmount || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Lista de Itens */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Itens ({dataToDisplay.items?.length || 0})
                      </h3>
                      <div className="space-y-3">
                        {dataToDisplay.items?.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            <div className="flex justify-between mt-2 text-xs text-gray-600">
                              <span>Qtd: {item.quantity}</span>
                              <span>{formatCurrency(item.totalPrice)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correções Aplicadas */}
                    {corrections.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-green-700 mb-2">
                          ✅ Correções Aplicadas
                        </h3>
                        <ul className="space-y-2">
                          {corrections.map((correction, index) => (
                            <li
                              key={index}
                              className="text-xs text-gray-700 bg-green-50 p-2 rounded"
                            >
                              • {correction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500">Carregando dados...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function ChatValidacaoPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChatValidacaoContent />
    </Suspense>
  )
}
