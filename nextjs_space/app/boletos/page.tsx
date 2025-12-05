'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Trash2,
  Building2,
  Upload
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';

interface Supplier {
  id: string;
  name: string;
}

interface Bill {
  id: string;
  supplierId: string;
  billNumber?: string | null;
  description: string;
  totalAmount: number;
  installments: number;
  currentInstallment: number;
  installmentAmount: number;
  dueDate: string;
  issueDate?: string | null;
  paymentDate?: string | null;
  status: string;
  fileUrl?: string | null;
  fileName?: string | null;
  notes?: string | null;
  supplier: Supplier;
}

export default function BoletosPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');

  const [formData, setFormData] = useState({
    supplierId: '',
    billNumber: '',
    description: '',
    totalAmount: '',
    installments: '1',
    dueDate: '',
    issueDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterSupplier]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar fornecedores
      const suppliersRes = await fetch('/api/suppliers');
      const suppliersData = await suppliersRes.json();
      setSuppliers(suppliersData.suppliers || []);

      // Carregar boletos com filtros
      let url = '/api/bills?';
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterSupplier !== 'all') url += `supplierId=${filterSupplier}&`;

      const billsRes = await fetch(url);
      const billsData = await billsRes.json();
      setBills(billsData.bills || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId || !formData.description || !formData.totalAmount || !formData.dueDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('supplierId', formData.supplierId);
      formDataToSend.append('billNumber', formData.billNumber);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('totalAmount', formData.totalAmount);
      formDataToSend.append('installments', formData.installments);
      formDataToSend.append('dueDate', formData.dueDate);
      if (formData.issueDate) formDataToSend.append('issueDate', formData.issueDate);
      if (formData.notes) formDataToSend.append('notes', formData.notes);
      if (selectedFile) formDataToSend.append('file', selectedFile);

      const response = await fetch('/api/bills', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) throw new Error('Erro ao cadastrar boleto');

      toast.success('Boleto cadastrado com sucesso!');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao cadastrar boleto:', error);
      toast.error('Erro ao cadastrar boleto');
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
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

      if (!response.ok) throw new Error('Erro ao marcar como pago');

      toast.success('Boleto marcado como pago!');
      loadData();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toast.error('Erro ao marcar como pago');
    }
  };

  const handleDelete = async (billId: string) => {
    if (!confirm('Tem certeza que deseja excluir este boleto?')) return;

    try {
      const response = await fetch(`/api/bills?id=${billId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar boleto');

      toast.success('Boleto excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar boleto:', error);
      toast.error('Erro ao deletar boleto');
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      billNumber: '',
      description: '',
      totalAmount: '',
      installments: '1',
      dueDate: '',
      issueDate: '',
      notes: ''
    });
    setSelectedFile(null);
  };

  const getBillStatusColor = (bill: Bill) => {
    if (bill.status === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    
    const daysUntilDue = differenceInDays(new Date(bill.dueDate), new Date());
    
    if (daysUntilDue < 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (daysUntilDue <= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  };

  const getBillStatusIcon = (bill: Bill) => {
    if (bill.status === 'paid') return <CheckCircle2 className="w-4 h-4" />;
    
    const daysUntilDue = differenceInDays(new Date(bill.dueDate), new Date());
    
    if (daysUntilDue < 0) return <AlertCircle className="w-4 h-4" />;
    if (daysUntilDue <= 3) return <Clock className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const getBillStatusText = (bill: Bill) => {
    if (bill.status === 'paid') return 'Pago';
    
    const daysUntilDue = differenceInDays(new Date(bill.dueDate), new Date());
    
    if (daysUntilDue < 0) return `Vencido há ${Math.abs(daysUntilDue)} dias`;
    if (daysUntilDue === 0) return 'Vence hoje';
    if (daysUntilDue <= 3) return `Vence em ${daysUntilDue} dias`;
    return 'Pendente';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Boletos a Pagar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os boletos e contas do restaurante
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Boleto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Boleto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="supplierId">Fornecedor *</Label>
                  <Select 
                    value={formData.supplierId} 
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="billNumber">Número do Boleto</Label>
                  <Input
                    id="billNumber"
                    value={formData.billNumber}
                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                    placeholder="Ex: 12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="totalAmount">Valor Total *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Ex: Pagamento de fornecimento"
                  />
                </div>

                <div>
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Data de Vencimento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Data de Emissão</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="file">Anexar Boleto (PDF ou Imagem)</Label>
                  <div className="mt-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Arquivo selecionado: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Fornecedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Fornecedores</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Boletos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando boletos...</p>
        </div>
      ) : bills.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum boleto encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comece cadastrando seu primeiro boleto
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Boleto
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <Card key={bill.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {bill.description}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {bill.supplier.name}
                        </span>
                      </div>
                    </div>
                    <Badge className={getBillStatusColor(bill)}>
                      <div className="flex items-center gap-1">
                        {getBillStatusIcon(bill)}
                        {getBillStatusText(bill)}
                      </div>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(Number(bill.installmentAmount))}
                      </p>
                      {bill.installments > 1 && (
                        <p className="text-xs text-gray-500">
                          {bill.currentInstallment}/{bill.installments} parcelas
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(new Date(bill.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>

                    {bill.billNumber && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Número</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {bill.billNumber}
                        </p>
                      </div>
                    )}

                    {bill.paymentDate && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Data de Pagamento</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(new Date(bill.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>

                  {bill.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
                      {bill.notes}
                    </p>
                  )}
                </div>

                <div className="flex lg:flex-col gap-2">
                  {bill.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(bill.fileUrl!, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Ver Arquivo
                    </Button>
                  )}
                  
                  {bill.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(bill.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Marcar como Pago
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(bill.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
