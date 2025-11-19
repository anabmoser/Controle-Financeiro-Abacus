
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Upload, FileText, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Tipo de arquivo não suportado. Use JPG, PNG ou PDF.')
      return
    }

    // Validar tamanho (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
      return
    }

    setFile(selectedFile)

    // Criar preview se for imagem
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  async function handleUpload() {
    if (!file) {
      toast.error('Selecione um arquivo primeiro')
      return
    }

    try {
      setUploading(true)

      // 1. Fazer upload do arquivo
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro no upload do arquivo')
      }

      const uploadData = await uploadResponse.json()
      toast.success('Arquivo enviado com sucesso!')

      // 2. Processar com OCR
      setUploading(false)
      setProcessing(true)

      const ocrResponse = await fetch('/api/ocr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: uploadData.receiptId,
          cloudStoragePath: uploadData.cloudStoragePath,
        }),
      })

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({}))
        const errorMsg = errorData.details || errorData.error || 'Erro no processamento OCR'
        throw new Error(errorMsg)
      }

      const ocrData = await ocrResponse.json()
      
      // Verificar se houve erro no processamento
      if (ocrData.error) {
        throw new Error(ocrData.error)
      }
      
      // Verificar se extraiu itens
      if (ocrData.data?.warning) {
        toast.error(ocrData.data.warning, { duration: 5000 })
        throw new Error('Nenhum item foi extraído do cupom. Tente tirar uma foto mais nítida com boa iluminação.')
      }
      
      if (!ocrData.data?.items || ocrData.data.items.length === 0) {
        toast.error('Nenhum produto foi identificado no cupom', { duration: 5000 })
        throw new Error('Não foi possível ler os produtos do cupom. Verifique se:\n- A foto está nítida\n- O texto está legível\n- O cupom está completo na imagem')
      }
      
      toast.success(`Documento processado! ${ocrData.data.items.length} itens encontrados.`)

      // 3. Redirecionar para validação com IA
      router.push(`/chat-validacao?receiptId=${uploadData.receiptId}`)
    } catch (error: any) {
      console.error('Erro completo:', error)
      const errorMessage = error?.message || 'Erro ao processar documento'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      setProcessing(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Upload de Cupom Fiscal
        </h1>

        {/* Área de Upload */}
        <div className="card">
          <div className="space-y-4">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading || processing}
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Clique para selecionar ou arraste um arquivo
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG ou PDF (máx. 10MB)
                </p>
              </div>
            </label>

            {/* Preview */}
            {file && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-8 w-8 text-blue-600" />
                  ) : (
                    <FileText className="h-8 w-8 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {preview && (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading || processing}
                  className="btn btn-primary w-full"
                >
                  {uploading && <LoadingSpinner size="sm" />}
                  {processing && <LoadingSpinner size="sm" />}
                  {!uploading && !processing && 'Processar Documento'}
                  {uploading && 'Enviando arquivo...'}
                  {processing && 'Processando com OCR...'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informações */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            📌 Como funciona?
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Faça upload da foto do cupom fiscal ou boleto</li>
            <li>O sistema processará o documento automaticamente com OCR</li>
            <li>
              Uma IA conversacional validará os dados extraídos com você
            </li>
            <li>Após validação, os dados serão salvos no sistema</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  )
}
