import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  Save, 
  ArrowLeft, 
  Loader2,
  Truck,
  Clock,
  Hash,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";

interface FormData {
  veiculo: string;
  horaChegada: string;
  horaSaida: string;
  numViagens: number;
}

export default function PipasMobile() {
  const navigate = useNavigate();
  const { canSeeTrips } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  const { data: veiculos } = useGoogleSheets('caminhao_pipa');

  const [formData, setFormData] = useState<FormData>({
    veiculo: "",
    horaChegada: format(new Date(), 'HH:mm'),
    horaSaida: "",
    numViagens: 1, // Valor padrão que será salvo automaticamente para apontadores
  });

  const veiculoSelecionado = useMemo(() => {
    return veiculos?.find(v => v.Prefixo === formData.veiculo);
  }, [veiculos, formData.veiculo]);

  const handleSubmit = async () => {
    if (!formData.veiculo || !formData.horaChegada) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Para apontadores, numViagens = 1 automaticamente
      const dataToSave = {
        ...formData,
        numViagens: canSeeTrips ? formData.numViagens : 1,
        data: format(new Date(), 'yyyy-MM-dd'),
      };
      
      console.log('Dados a salvar:', dataToSave);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Viagem registrada com sucesso!");
      navigate('/m');
    } catch {
      toast.error("Erro ao registrar viagem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-blue-600 px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-blue-700"
            onClick={() => navigate('/m')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Apontar Viagens</h1>
            <p className="text-xs text-white/70">
              Controle de Pipas
            </p>
          </div>
          <Droplets className="h-6 w-6 text-white/80" />
        </div>
      </header>

      {/* Form */}
      <div className="p-4 space-y-3 pb-32">
        {/* Veículo */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <Label className="font-semibold">Veículo (Pipa) *</Label>
            </div>
            <Select
              value={formData.veiculo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, veiculo: value }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {veiculos && veiculos.length > 0 ? (
                  veiculos.map((v) => (
                    <SelectItem key={v.Prefixo} value={v.Prefixo}>
                      {v.Prefixo} - {v.Empresa}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="PIPA-01">PIPA-01 - Empresa A</SelectItem>
                    <SelectItem value="PIPA-02">PIPA-02 - Empresa B</SelectItem>
                    <SelectItem value="PIPA-03">PIPA-03 - Empresa C</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {veiculoSelecionado && (
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>👤 Motorista: {veiculoSelecionado.Motorista}</p>
                <p>💧 Capacidade: {veiculoSelecionado.Capacidade || 'N/A'} L</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hora de Chegada */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <Label className="font-semibold">Hora de Chegada *</Label>
            </div>
            <Input
              type="time"
              className="h-12"
              value={formData.horaChegada}
              onChange={(e) => setFormData(prev => ({ ...prev, horaChegada: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* Hora de Saída */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <Label className="font-semibold">Hora de Saída</Label>
            </div>
            <Input
              type="time"
              className="h-12"
              value={formData.horaSaida}
              onChange={(e) => setFormData(prev => ({ ...prev, horaSaida: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* Número de Viagens - Apenas para Sala Técnica/Admin */}
        {canSeeTrips ? (
          <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <Label className="font-semibold">Nº de Viagens</Label>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                  SALA TÉCNICA
                </span>
              </div>
              <Input
                type="number"
                className="h-12"
                min={1}
                value={formData.numViagens}
                onChange={(e) => setFormData(prev => ({ ...prev, numViagens: parseInt(e.target.value) || 1 }))}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Viagem registrada automaticamente</p>
                  <p className="text-xs text-blue-600">1 viagem será contabilizada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-800">Controle de Abastecimento</p>
                <p className="text-xs text-blue-600">
                  {format(new Date(), 'dd/MM/yyyy')} - Registro automático
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-pb">
        <Button 
          className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700"
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
              SALVAR VIAGEM
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
