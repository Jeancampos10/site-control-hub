import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  MapPin,
  Truck,
  Package,
  Shovel,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useCargaAppend } from "@/hooks/useGoogleSheetsAppend";
import { MaterialCards } from "@/components/mobile/MaterialCards";
import { cn } from "@/lib/utils";

interface FormData {
  data: string;
  local: string;
  estaca: string;
  escavadeira: string;
  caminhao: string;
  tipoMaterial: string;
  numViagens: number;
  adicionarLancamento: boolean;
  localLancamento: string;
}

export default function CargaMobile() {
  const navigate = useNavigate();
  const { canEditDate, canSeeTrips } = usePermissions();
  const { appendCarga, isPending } = useCargaAppend();
  
  const { data: escavadeiras } = useGoogleSheets('equipamentos');
  const { data: caminhoes } = useGoogleSheets('caminhao');
  const { data: locais } = useGoogleSheets('locais');
  const { data: materiais } = useGoogleSheets('materiais');

  const [formData, setFormData] = useState<FormData>({
    data: format(new Date(), 'yyyy-MM-dd'),
    local: "",
    estaca: "",
    escavadeira: "",
    caminhao: "",
    tipoMaterial: "",
    numViagens: 1,
    adicionarLancamento: false,
    localLancamento: "",
  });

  const escavadeiraSelecionada = useMemo(() => {
    return escavadeiras?.find(e => e.Prefixo_Eq === formData.escavadeira);
  }, [escavadeiras, formData.escavadeira]);

  const caminhaoSelecionado = useMemo(() => {
    return caminhoes?.find(c => c.Prefixo_Cb === formData.caminhao);
  }, [caminhoes, formData.caminhao]);

  // Filtrar locais por tipo
  const locaisOrigem = useMemo(() => {
    return locais?.filter(l => l.Tipo === 'Origem' || !l.Tipo) || [];
  }, [locais]);

  const locaisDestino = useMemo(() => {
    return locais?.filter(l => l.Tipo === 'Destino' || !l.Tipo) || [];
  }, [locais]);

  const handleSubmit = async () => {
    if (!formData.local || !formData.escavadeira || !formData.caminhao || !formData.tipoMaterial) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: "Verifique os campos marcados com *"
      });
      return;
    }

    if (formData.adicionarLancamento && !formData.localLancamento) {
      toast.error("Selecione o local de lançamento");
      return;
    }

    try {
      await appendCarga({
        data: format(new Date(formData.data + 'T00:00:00'), 'dd/MM/yyyy'),
        local: formData.local,
        estaca: formData.estaca,
        escavadeira: formData.escavadeira,
        empresaEsc: escavadeiraSelecionada?.Empresa_Eq || '',
        operador: escavadeiraSelecionada?.Operador || '',
        caminhao: formData.caminhao,
        empresaCam: caminhaoSelecionado?.Empresa_Cb || '',
        motorista: caminhaoSelecionado?.Motorista || '',
        volume: caminhaoSelecionado?.Volume || '',
        material: formData.tipoMaterial,
        numViagens: canSeeTrips ? formData.numViagens : 1,
        adicionarLancamento: formData.adicionarLancamento,
        localLancamento: formData.localLancamento,
      });
      
      // Notificação de sucesso com vibração
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      toast.success(
        formData.adicionarLancamento 
          ? "✅ Carga e Lançamento registrados!" 
          : "✅ Carga registrada com sucesso!",
        { 
          description: `${formData.caminhao} - ${formData.tipoMaterial}`,
          duration: 4000,
        }
      );
      navigate('/m');
    } catch (error) {
      console.error('Error saving:', error);
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      toast.error("❌ Erro ao registrar carga", {
        description: "Verifique sua conexão e tente novamente"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-primary px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={() => navigate('/m')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground">Nova Carga</h1>
            <p className="text-xs text-primary-foreground/70">
              Apropriação de Terraplanagem
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="p-4 space-y-3 pb-32">
        {/* Data */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
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
              <MapPin className="h-4 w-4 text-amber-600" />
              <Label className="font-semibold">Local de Carga *</Label>
            </div>
            <Select
              value={formData.local}
              onValueChange={(value) => setFormData(prev => ({ ...prev, local: value }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {locaisOrigem.length > 0 ? (
                  locaisOrigem.map((loc, index) => (
                    <SelectItem key={index} value={loc.Nome || loc.Local || `local-${index}`}>
                      {loc.Nome || loc.Local} {loc.Obra && `- ${loc.Obra}`}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="jazida-norte">Jazida Norte - BR-101</SelectItem>
                    <SelectItem value="corte-km45">Corte KM 45 - BR-101</SelectItem>
                    <SelectItem value="jazida-sul">Jazida Sul - BR-101</SelectItem>
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
              placeholder="Ex: 100+500"
            />
          </CardContent>
        </Card>

        {/* Escavadeira */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shovel className="h-4 w-4 text-amber-600" />
              <Label className="font-semibold">Escavadeira *</Label>
            </div>
            <Select
              value={formData.escavadeira}
              onValueChange={(value) => setFormData(prev => ({ ...prev, escavadeira: value }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a escavadeira" />
              </SelectTrigger>
              <SelectContent>
                {escavadeiras?.map((esc) => (
                  <SelectItem key={esc.Prefixo_Eq} value={esc.Prefixo_Eq}>
                    {esc.Prefixo_Eq} - {esc.Empresa_Eq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {escavadeiraSelecionada && (
              <p className="text-xs text-muted-foreground mt-2">
                👤 Operador: {escavadeiraSelecionada.Operador}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Caminhão */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-primary" />
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

        {/* Material - Cards coloridos */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-orange-600" />
              <Label className="font-semibold">Tipo de Material *</Label>
            </div>
            <MaterialCards
              value={formData.tipoMaterial}
              onChange={(value) => setFormData(prev => ({ ...prev, tipoMaterial: value }))}
              customMaterials={materiais}
            />
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

        {/* Adicionar Lançamento */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600" />
                <div>
                  <Label className="font-semibold">Adicionar Lançamento</Label>
                  <p className="text-xs text-muted-foreground">Registrar também a descarga</p>
                </div>
              </div>
              <Switch
                checked={formData.adicionarLancamento}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adicionarLancamento: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {formData.adicionarLancamento && (
          <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <Label className="font-semibold">Local de Lançamento *</Label>
              </div>
              <Select
                value={formData.localLancamento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, localLancamento: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o local de descarga" />
                </SelectTrigger>
                <SelectContent>
                  {locaisDestino.length > 0 ? (
                    locaisDestino.map((loc, index) => (
                      <SelectItem key={index} value={loc.Nome || loc.Local || `destino-${index}`}>
                        {loc.Nome || loc.Local} {loc.Obra && `- ${loc.Obra}`}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="aterro-sul">Aterro Sul - BR-101</SelectItem>
                      <SelectItem value="aterro-norte">Aterro Norte - BR-101</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-pb">
        <Button 
          className="w-full h-14 text-lg font-bold"
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
              {formData.adicionarLancamento ? 'SALVAR CARGA + LANÇAMENTO' : 'SALVAR CARGA'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
