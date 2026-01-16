import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Save, 
  ArrowLeft, 
  ChevronDown, 
  Loader2,
  MapPin,
  Truck,
  Package,
  Shovel,
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

interface FormData {
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
  const { canSeeTrips } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  const { data: escavadeiras } = useGoogleSheets('equipamentos');
  const { data: caminhoes } = useGoogleSheets('caminhao');

  const [formData, setFormData] = useState<FormData>({
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

  const handleSubmit = async () => {
    if (!formData.local || !formData.escavadeira || !formData.caminhao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Carga registrada com sucesso!");
      navigate('/m');
    } catch {
      toast.error("Erro ao registrar carga");
    } finally {
      setLoading(false);
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
          <div>
            <h1 className="text-base font-bold text-primary-foreground">Nova Carga</h1>
            <p className="text-xs text-primary-foreground/70">
              {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="p-4 space-y-4 pb-32">
        {/* Local */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
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
                <SelectItem value="jazida-norte">Jazida Norte - BR-101</SelectItem>
                <SelectItem value="corte-km45">Corte KM 45 - BR-101</SelectItem>
                <SelectItem value="jazida-sul">Jazida Sul - BR-101</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Estaca */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Label className="font-semibold mb-2 block">Estaca</Label>
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
                Operador: {escavadeiraSelecionada.Operador}
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
                Motorista: {caminhaoSelecionado.Motorista} | Volume: {caminhaoSelecionado.Volume}m³
              </p>
            )}
          </CardContent>
        </Card>

        {/* Material */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-warning" />
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
                <SelectItem value="argila">Argila</SelectItem>
                <SelectItem value="brita">Brita</SelectItem>
                <SelectItem value="areia">Areia</SelectItem>
                <SelectItem value="rachao">Pedra Rachão</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Número de Viagens - Apenas para Sala Técnica/Admin */}
        {canSeeTrips && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Label className="font-semibold mb-2 block">Nº de Viagens</Label>
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
              <div>
                <Label className="font-semibold">Adicionar Lançamento</Label>
                <p className="text-xs text-muted-foreground">Registrar também o local de descarga</p>
              </div>
              <Switch
                checked={formData.adicionarLancamento}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adicionarLancamento: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {formData.adicionarLancamento && (
          <Card className="border-0 shadow-sm border-l-4 border-l-accent">
            <CardContent className="p-4">
              <Label className="font-semibold mb-2 block">Local de Lançamento</Label>
              <Select
                value={formData.localLancamento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, localLancamento: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o local de descarga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aterro-sul">Aterro Sul - BR-101</SelectItem>
                  <SelectItem value="aterro-norte">Aterro Norte - BR-101</SelectItem>
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
              SALVAR CARGA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
