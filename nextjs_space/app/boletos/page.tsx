'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Download, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Bill {
  id: string;
  supplierName: string;
  supplierCnpj: string | null;
  billNumber: string | null;
  barCode: string | null;
  description: string | null;
  totalAmount: number;
  dueDate: string;
  issueDate: string | null;
  paymentDate: string | null;
  status: string;
  fileUrl: string;
  fileName: string;
  ocrStatus: string;
  ocrError: string | null;
  createdAt: string;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming' | 'paid'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBills();
  }, []);

  async function loadBills() {
    try {
      setLoading(true);
      const response = await fetch('/api/bills');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar boletos');
      }
      
      const data = await response.json();
      setBills(data.bills || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // Upload do arquivo
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/bills/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      const { billId } = await uploadResponse.json();
      setUploading(false);
      setProcessing(true);

      // Processar OCR
      const ocrResponse = await fetch('/api/bills/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId })
      });

      if (!ocrResponse.ok) {
        throw new Error('Erro ao processar OCR');
      }

      setSuccess('Boleto cadastrado com sucesso!');
      await loadBills();
      event.target.value = ''; // Limpar input
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  }

  async function handleMarkAsPaid(billId: string) {
    try {
      const response = await fetch('/api/bills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: billId,
          status: 'paid',
          paymentDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar como pago');
      }

      setSuccess('Boleto marcado como pago!');
      await loadBills();
    } catch (error: any) {
      setError(error.message);
    }
  }

  async function handleDelete(billId: string) {
    if (!confirm('Tem certeza que deseja excluir este boleto?')) return;

    try {
      const response = await fetch('/api/bills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: billId })
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir boleto');
      }

      setSuccess('Boleto excluído com sucesso!');
      await loadBills();
    } catch (error: any) {
      setError(error.message);
    }
  }

  function getBillStatus(bill: Bill) {
    if (bill.status === 'paid') {
      return { color: 'bg-green-500', label: 'Pago', icon: CheckCircle };
    }

    const dueDate = new Date(bill.dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);

    if (isPast(dueDate) && !bill.paymentDate) {
      return { color: 'bg-red-500', label: `Vencido há ${Math.abs(daysUntilDue)} dias`, icon: AlertCircle };
    }

    if (daysUntilDue <= 3) {
      return { color: 'bg-yellow-500', label: `Vence em ${daysUntilDue} dias`, icon: Clock };
    }

    return { color: 'bg-blue-500', label: `Vence em ${daysUntilDue} dias`, icon: Clock };
  }

  const filteredBills = bills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    const today = new Date();

    switch (filter) {
      case 'overdue':
        return isPast(dueDate) && bill.status === 'pending';
      case 'upcoming':
        return isFuture(dueDate) && bill.status === 'pending';
      case 'paid':
        return bill.status === 'paid';
      default:
        return true;
    }
  });

  const stats = {
    total: bills.length,
    overdue: bills.filter(b => isPast(new Date(b.dueDate)) && b.status === 'pending').length,
    upcoming: bills.filter(b => isFuture(new Date(b.dueDate)) && b.status === 'pending').length,
    paid: bills.filter(b => b.status === 'paid').length,
    totalAmount: bills
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0)
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Boletos a Pagar</h1>
          <p className="text-muted-foreground mt-1">
            Faça upload de boletos e gerencie seus pagamentos
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Boleto
          </CardTitle>
          <CardDescription>
            Envie uma imagem ou PDF do boleto. O sistema extrairá os dados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={handleFileUpload}
              disabled={uploading || processing}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <FileText className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  {uploading ? 'Enviando arquivo...' : processing ? 'Processando OCR...' : 'Clique para selecionar um arquivo'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
                </p>
              </div>
              {(uploading || processing) && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total de Boletos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Vencidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">A Vencer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">A Pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          onClick={() => setFilter('overdue')}
        >
          Vencidos
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
        >
          A Vencer
        </Button>
        <Button
          variant={filter === 'paid' ? 'default' : 'outline'}
          onClick={() => setFilter('paid')}
        >
          Pagos
        </Button>
      </div>

      {/* Lista de Boletos */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : filteredBills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum boleto encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBills.map(bill => {
            const status = getBillStatus(bill);
            const StatusIcon = status.icon;

            return (
              <Card key={bill.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${status.color} bg-opacity-10`}>
                          <StatusIcon className={`h-5 w-5 ${status.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{bill.supplierName}</h3>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          {bill.supplierCnpj && (
                            <p className="text-sm text-muted-foreground">CNPJ: {bill.supplierCnpj}</p>
                          )}
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor</p>
                          <p className="font-semibold text-lg">{formatCurrency(Number(bill.totalAmount))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vencimento</p>
                          <p className="font-medium">
                            {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        {bill.billNumber && (
                          <div>
                            <p className="text-muted-foreground">Número</p>
                            <p className="font-medium">{bill.billNumber}</p>
                          </div>
                        )}
                        {bill.paymentDate && (
                          <div>
                            <p className="text-muted-foreground">Pago em</p>
                            <p className="font-medium">
                              {format(new Date(bill.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </div>

                      {bill.description && (
                        <p className="text-sm text-muted-foreground">{bill.description}</p>
                      )}

                      {bill.ocrStatus === 'error' && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Erro no OCR: {bill.ocrError || 'Erro desconhecido'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(bill.fileUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {bill.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(bill.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bill.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
