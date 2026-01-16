import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  MapPin,
  Truck,
  Package,
  Calendar,
  Hash,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useLancamentoAppend } from "@/hooks/useGoogleSheetsAppend";
import { cn } from "@/lib/utils";

interface FormData {
  data: string;
  local: string;
  estaca: string;
  caminhao: string;
  tipoMaterial: string;
  numViagens: number;
}

export default function LancamentoMobile() {
  const navigate = useNavigate();
  const { canEditDate, canSeeTrips } = usePermissions();
  const { appendLancamento, isPending } = useLancamentoAppend();
  
  const { data: caminhoes } = useGoogleSheets('caminhao');
  const { data: locais } = useGoogleSheets('locais');
  const { data: materiais } = useGoogleSheets('materiais');

  const [formData, setFormData] = useState<FormData>({
    data: format(new Date(), 'yyyy-MM-dd'),
    local: "",
    estaca: "",
    caminhao: "",
    tipoMaterial: "",
    numViagens: 1,
  });

  const caminhaoSelecionado = useMemo(() => {
    return caminhoes?.find(c => c.Prefixo_Cb === formData.caminhao);
  }, [caminhoes, formData.caminhao]);

  const locaisDestino = useMemo(() => {
    return locais?.filter(l => l.Tipo === 'Destino' || !l.Tipo) || [];
  }, [locais]);

  const handleSubmit = async () => {
    if (!formData.local || !formData.caminhao || !formData.tipoMaterial) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await appendLancamento({
        data: format(new Date(formData.data + 'T00:00:00'), 'dd/MM/yyyy'),
        local: formData.local,
        estaca: formData.estaca,
        caminhao: formData.caminhao,
        empresa: caminhaoSelecionado?.Empresa_Cb || '',
        motorista: caminhaoSelecionado?.Motorista || '',
        volume: caminhaoSelecionado?.Volume || '',
        material: formData.tipoMaterial,
        numViagens: canSeeTrips ? formData.numViagens : 1,
      });
      
      toast.success("Lançamento registrado!", {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      });
      navigate('/m');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Erro ao registrar lançamento");
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
            <h1 className="text-lg font-bold text-white">Lançamento (Descarga)</h1>
            <p className="text-xs text-white/70">
              Registro de Descarga
            </p>
          </div>
          <Download className="h-6 w-6 text-white/80" />
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

        {/* Local */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <Label className="font-semibold">Local de Lançamento *</Label>
            </div>
            <Select
              value={formData.local}
              onValueChange={(value) => setFormData(prev => ({ ...prev, local: value }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {locaisDestino.length > 0 ? (
                  locaisDestino.map((loc, index) => (
                    <SelectItem key={index} value={loc.Nome || loc.Local || `local-${index}`}>
                      {loc.Nome || loc.Local} {loc.Obra && `- ${loc.Obra}`}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="aterro-sul">Aterro Sul - BR-101</SelectItem>
                    <SelectItem value="aterro-norte">Aterro Norte - BR-101</SelectItem>
                    <SelectItem value="aterro-km30">Aterro KM 30 - BR-101</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Estaca */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-slate-600" />
              <Label className="font-semibold">Estaca</Label>
            </div>
            <Input
              className="h-12"
              value={formData.estaca}
              onChange={(e) => setFormData(prev => ({ ...prev, estaca: e.target.value }))}
              placeholder="Ex: 200+300"
            />
          </CardContent>
        </Card>

        {/* Caminhão */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-emerald-600" />
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
                  <SelectItem key={cam.Prefixo_Cb} value={cam.Prefixo_Cb}>
                    {cam.Prefixo_Cb} - {cam.Empresa_Cb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {caminhaoSelecionado && (
              <p className="text-xs text-muted-foreground mt-2">
                👤 Motorista: {caminhaoSelecionado.Motorista} | 📦 Volume: {caminhaoSelecionado.Volume}m³
              </p>
            )}
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
                    <SelectItem value="argila">Argila</SelectItem>
                    <SelectItem value="brita">Brita</SelectItem>
                    <SelectItem value="areia">Areia</SelectItem>
                    <SelectItem value="rachao">Pedra Rachão</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Número de Viagens - Apenas para Sala Técnica/Admin */}
        {canSeeTrips && (
          <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <Label className="font-semibold">Nº de Viagens</Label>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                  ADM
                </span>
              </div>
              <Input
                className="h-12"
                type="number"
                min={1}
                value={formData.numViagens}
                onChange={(e) => setFormData(prev => ({ ...prev, numViagens: parseInt(e.target.value) || 1 }))}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-pb">
        <Button 
          className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              SALVANDO...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              SALVAR LANÇAMENTO
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
