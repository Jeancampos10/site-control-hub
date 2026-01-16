import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { DateFilter } from "@/components/shared/DateFilter";

interface FormData {
  data: Date;
  tipo: 'Entrada' | 'Saída' | '';
  quantidade: number;
  notaFiscal: string;
  valor: number;
  fornecedor: string;
}

export default function ApontadorCal() {
  const { canEditDate } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  // Carregar dados das planilhas
  const { data: fornecedores } = useGoogleSheets<Record<string, string>>('fornecedores_cal');

  const [formData, setFormData] = useState<FormData>({
    data: new Date(),
    tipo: '',
    quantidade: 0,
    notaFiscal: '',
    valor: 0,
    fornecedor: '',
  });

  const isEntrada = formData.tipo === 'Entrada';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const calData = {
        Data: format(formData.data, 'dd/MM/yyyy'),
        Tipo: formData.tipo,
        Quantidade: formData.quantidade,
        ...(isEntrada && {
          'Nota Fiscal': formData.notaFiscal,
          Valor: formData.valor,
          Fornecedor: formData.fornecedor,
        }),
      };

      console.log('Salvando movimento CAL:', calData);
      
      toast.success(`${formData.tipo} de CAL registrada com sucesso!`);
      
      // Limpar formulário
      setFormData(prev => ({
        ...prev,
        tipo: '',
        quantidade: 0,
        notaFiscal: '',
        valor: 0,
        fornecedor: '',
      }));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao registrar movimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title">Registrar Movimento - CAL</h1>
          <p className="page-subtitle">Controle de entrada e saída de CAL</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-warning" />
              Novo Movimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              {canEditDate ? (
                <DateFilter
                  date={formData.data}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, data: date || new Date() }))}
                  showClear={false}
                />
              ) : (
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
                  {format(formData.data, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Movimento</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'Entrada' | 'Saída') => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saída">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade (kg)</Label>
              <Input
                id="quantidade"
                type="number"
                min={0}
                value={formData.quantidade || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))}
                placeholder="Digite a quantidade"
              />
            </div>

            {/* Campos condicionais - Apenas para Entrada */}
            {isEntrada && (
              <>
                {/* Fornecedor */}
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Select
                    value={formData.fornecedor}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fornecedor: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores?.filter(f => f.Ativo === 'Sim').map((f) => (
                        <SelectItem key={f.Nome} value={f.Nome}>
                          {f.Nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nota Fiscal */}
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="notaFiscal">Nota Fiscal</Label>
                  <Input
                    id="notaFiscal"
                    value={formData.notaFiscal}
                    onChange={(e) => setFormData(prev => ({ ...prev, notaFiscal: e.target.value }))}
                    placeholder="Número da nota fiscal"
                  />
                </div>

                {/* Valor */}
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.valor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                  />
                </div>
              </>
            )}

            {/* Botão Salvar */}
            <Button type="submit" className="w-full" disabled={loading || !formData.tipo}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Movimento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
