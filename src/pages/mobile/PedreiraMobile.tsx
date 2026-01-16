import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  Truck,
  Package,
  Calendar,
  Hash,
  Clock,
  Scale,
  Mountain,
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
  caminhao: string;
  horaCarregamento: string;
  numeroPedido: string;
  pesoFinal: number;
  pesoLiquido: number;
  tipoMaterial: string;
}

export default function PedreiraMobile() {
  const navigate = useNavigate();
  const { canEditDate } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  const { data: caminhoes } = useGoogleSheets('cam_reboque');
  const { data: materiais } = useGoogleSheets('materiais');

  const [formData, setFormData] = useState<FormData>({
    data: format(new Date(), 'yyyy-MM-dd'),
    caminhao: "",
    horaCarregamento: format(new Date(), 'HH:mm'),
    numeroPedido: "",
    pesoFinal: 0,
    pesoLiquido: 0,
    tipoMaterial: "",
  });

  const caminhaoSelecionado = useMemo(() => {
    return caminhoes?.find(c => c.Prefixo === formData.caminhao);
  }, [caminhoes, formData.caminhao]);

  // Calcular peso líquido automaticamente
  const pesoTara = caminhaoSelecionado?.Peso_Vazio ? Number(caminhaoSelecionado.Peso_Vazio) : 0;
  const pesoLiquidoCalculado = formData.pesoFinal > 0 ? formData.pesoFinal - pesoTara : 0;

  const handleSubmit = async () => {
    if (!formData.caminhao || !formData.tipoMaterial || !formData.pesoFinal) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Carregamento registrado com sucesso!");
      navigate('/m');
    } catch {
      toast.error("Erro ao registrar carregamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-orange-600 px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-orange-700"
            onClick={() => navigate('/m')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Apontar Carregamento</h1>
            <p className="text-xs text-white/70">
              Controle de Pedreira
            </p>
          </div>
          <Mountain className="h-6 w-6 text-white/80" />
        </div>
      </header>

      {/* Form */}
      <div className="p-4 space-y-3 pb-32">
        {/* Data */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-orange-600" />
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

        {/* Caminhão */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-orange-600" />
              <Label className="font-semibold">Caminhão *</Label>
            </div>
            <Select
              value={formData.caminhao}
              onValueChange={(value) => setFormData(prev => ({ ...prev, caminhao: value }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o caminhão" />
              </SelectTrigger>
              <SelectContent>
                {caminhoes?.map((cam) => (
                  <SelectItem key={cam.Prefixo} value={cam.Prefixo}>
                    {cam.Prefixo} - {cam.Empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {caminhaoSelecionado && (
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>👤 Motorista: {caminhaoSelecionado.Motorista}</p>
                <p>⚖️ Tara: {caminhaoSelecionado.Peso_Vazio || 0} kg</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hora de Carregamento */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <Label className="font-semibold">Hora de Carregamento</Label>
            </div>
            <Input
              type="time"
              className="h-12"
              value={formData.horaCarregamento}
              onChange={(e) => setFormData(prev => ({ ...prev, horaCarregamento: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* Número do Pedido */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-slate-600" />
              <Label className="font-semibold">Nº do Pedido</Label>
            </div>
            <Input
              className="h-12"
              value={formData.numeroPedido}
              onChange={(e) => setFormData(prev => ({ ...prev, numeroPedido: e.target.value }))}
              placeholder="Ex: PED-001"
            />
          </CardContent>
        </Card>

        {/* Peso Final */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-orange-600" />
              <Label className="font-semibold">Peso Final (kg) *</Label>
            </div>
            <Input
              type="number"
              className="h-12"
              value={formData.pesoFinal || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, pesoFinal: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
            />
          </CardContent>
        </Card>

        {/* Peso Líquido - Calculado */}
        <Card className="border-0 shadow-sm bg-orange-50 border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-orange-600" />
              <Label className="font-semibold">Peso Líquido (kg)</Label>
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-auto">
                AUTO
              </span>
            </div>
            <div className="h-12 flex items-center px-3 bg-white rounded-md border text-lg font-bold text-orange-600">
              {pesoLiquidoCalculado.toLocaleString('pt-BR')} kg
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              = Peso Final ({formData.pesoFinal.toLocaleString('pt-BR')}) - Tara ({pesoTara.toLocaleString('pt-BR')})
            </p>
          </CardContent>
        </Card>

        {/* Material */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-orange-600" />
              <Label className="font-semibold">Tipo de Material *</Label>
            </div>
            <Select
              value={formData.tipoMaterial}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipoMaterial: value }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o material" />
              </SelectTrigger>
              <SelectContent>
                {materiais && materiais.length > 0 ? (
                  materiais.map((mat, index) => (
                    <SelectItem key={index} value={mat.Nome || mat.Material || `mat-${index}`}>
                      {mat.Nome || mat.Material}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="brita0">Brita 0</SelectItem>
                    <SelectItem value="brita1">Brita 1</SelectItem>
                    <SelectItem value="pedra">Pedra</SelectItem>
                    <SelectItem value="rachao">Rachão</SelectItem>
                    <SelectItem value="po-de-pedra">Pó de Pedra</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-pb">
        <Button 
          className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              SALVANDO...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              SALVAR CARREGAMENTO
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
