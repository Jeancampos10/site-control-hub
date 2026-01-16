import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  Calendar,
  Hash,
  FlaskConical,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  DollarSign,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { cn } from "@/lib/utils";

interface FormData {
  data: string;
  tipo: 'Entrada' | 'Saida' | '';
  quantidade: number;
  notaFiscal: string;
  valor: number;
  fornecedor: string;
}

export default function CalMobile() {
  const navigate = useNavigate();
  const { canEditDate } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  const { data: fornecedores } = useGoogleSheets('fornecedores_cal');

  const [formData, setFormData] = useState<FormData>({
    data: format(new Date(), 'yyyy-MM-dd'),
    tipo: '',
    quantidade: 0,
    notaFiscal: "",
    valor: 0,
    fornecedor: "",
  });

  const isEntrada = formData.tipo === 'Entrada';

  const handleSubmit = async () => {
    if (!formData.tipo || !formData.quantidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (isEntrada && !formData.notaFiscal) {
      toast.error("Informe a Nota Fiscal para entrada");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${formData.tipo} registrada com sucesso!`);
      navigate('/m');
    } catch {
      toast.error("Erro ao registrar movimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-emerald-600 px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-emerald-700"
            onClick={() => navigate('/m')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Registrar Movimento</h1>
            <p className="text-xs text-white/70">
              Controle de CAL
            </p>
          </div>
          <FlaskConical className="h-6 w-6 text-white/80" />
        </div>
      </header>

      {/* Form */}
      <div className="p-4 space-y-3 pb-32">
        {/* Data */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <Label className="font-semibold">Data</Label>
              {!canEditDate && (
                <span className="text-[10px] text-muted-foreground ml-auto">🔒 Bloqueado</span>
              )}
            </div>
            <Input
              type="date"
              className={cn("h-12", !canEditDate && "bg-slate-100")}
              value={formData.data}
              onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
              disabled={!canEditDate}
            />
          </CardContent>
        </Card>

        {/* Tipo */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Label className="font-semibold mb-3 block">Tipo de Movimento *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tipo: 'Entrada' }))}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  formData.tipo === 'Entrada' 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-slate-200 hover:border-emerald-300"
                )}
              >
                <ArrowDownCircle className={cn(
                  "h-8 w-8",
                  formData.tipo === 'Entrada' ? "text-emerald-600" : "text-slate-400"
                )} />
                <span className={cn(
                  "font-semibold",
                  formData.tipo === 'Entrada' ? "text-emerald-700" : "text-slate-600"
                )}>Entrada</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tipo: 'Saida' }))}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  formData.tipo === 'Saida' 
                    ? "border-red-500 bg-red-50" 
                    : "border-slate-200 hover:border-red-300"
                )}
              >
                <ArrowUpCircle className={cn(
                  "h-8 w-8",
                  formData.tipo === 'Saida' ? "text-red-600" : "text-slate-400"
                )} />
                <span className={cn(
                  "font-semibold",
                  formData.tipo === 'Saida' ? "text-red-700" : "text-slate-600"
                )}>Saída</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quantidade */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-emerald-600" />
              <Label className="font-semibold">Quantidade (kg) *</Label>
            </div>
            <Input
              type="number"
              className="h-12"
              value={formData.quantidade || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
            />
          </CardContent>
        </Card>

        {/* Campos condicionais para Entrada */}
        {isEntrada && (
          <>
            {/* Nota Fiscal */}
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <Label className="font-semibold">Nota Fiscal *</Label>
                </div>
                <Input
                  className="h-12"
                  value={formData.notaFiscal}
                  onChange={(e) => setFormData(prev => ({ ...prev, notaFiscal: e.target.value }))}
                  placeholder="Nº da Nota Fiscal"
                />
              </CardContent>
            </Card>

            {/* Valor */}
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <Label className="font-semibold">Valor (R$)</Label>
                </div>
                <Input
                  type="number"
                  className="h-12"
                  step="0.01"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </CardContent>
            </Card>

            {/* Fornecedor */}
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <Label className="font-semibold">Fornecedor</Label>
                </div>
                <Select
                  value={formData.fornecedor}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fornecedor: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores && fornecedores.length > 0 ? (
                      fornecedores.map((f, index) => (
                        <SelectItem key={index} value={f.Nome || `forn-${index}`}>
                          {f.Nome}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="fornecedor-a">Fornecedor A</SelectItem>
                        <SelectItem value="fornecedor-b">Fornecedor B</SelectItem>
                        <SelectItem value="fornecedor-c">Fornecedor C</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </>
        )}

        {/* Summary Card */}
        {formData.tipo && (
          <Card className={cn(
            "border-0 shadow-sm",
            isEntrada ? "bg-emerald-50" : "bg-red-50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {isEntrada ? (
                  <ArrowDownCircle className="h-8 w-8 text-emerald-500" />
                ) : (
                  <ArrowUpCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    isEntrada ? "text-emerald-800" : "text-red-800"
                  )}>
                    {isEntrada ? 'Entrada de CAL' : 'Saída de CAL'}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isEntrada ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formData.quantidade > 0 ? `${formData.quantidade.toLocaleString('pt-BR')} kg` : 'Quantidade não informada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-pb">
        <Button 
          className={cn(
            "w-full h-14 text-lg font-bold",
            formData.tipo === 'Saida' ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
          )}
          onClick={handleSubmit}
          disabled={loading || !formData.tipo}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              SALVANDO...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              SALVAR {formData.tipo ? formData.tipo.toUpperCase() : 'MOVIMENTO'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
