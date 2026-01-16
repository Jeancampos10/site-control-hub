import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, Plus, Loader2 } from "lucide-react";
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
  local: string;
  estaca: string;
  caminhao: string;
  tipoMaterial: string;
  numViagens: number;
}

export default function ApontadorLancamento() {
  const { canEditDate, canSeeTrips } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  // Carregar dados das planilhas
  const { data: caminhoes } = useGoogleSheets<Record<string, string>>('caminhao');
  const { data: locais } = useGoogleSheets<Record<string, string>>('locais');
  const { data: materiais } = useGoogleSheets<Record<string, string>>('materiais');

  const [formData, setFormData] = useState<FormData>({
    data: new Date(),
    local: "",
    estaca: "",
    caminhao: "",
    tipoMaterial: "",
    numViagens: 1,
  });

  // Dados automáticos quando seleciona um equipamento
  const caminhaoSelecionado = useMemo(() => {
    return caminhoes?.find(c => c.Prefixo === formData.caminhao);
  }, [caminhoes, formData.caminhao]);

  // Locais de destino
  const locaisDestino = useMemo(() => {
    return locais?.filter(l => l.Tipo === 'Destino' && l.Ativo === 'Sim') || [];
  }, [locais]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lancamentoData = {
        Data: format(formData.data, 'dd/MM/yyyy'),
        Local: formData.local,
        Estaca: formData.estaca,
        Caminhão: formData.caminhao,
        Motorista: caminhaoSelecionado?.Motorista || '',
        'Empresa Caminhão': caminhaoSelecionado?.Empresa || '',
        Volume: caminhaoSelecionado?.Volume || '',
        'Tipo Material': formData.tipoMaterial,
        'Nº Viagens': formData.numViagens,
      };

      console.log('Salvando lançamento:', lancamentoData);
      
      toast.success("Lançamento registrado com sucesso!");
      
      // Limpar formulário
      setFormData(prev => ({
        ...prev,
        local: "",
        estaca: "",
        caminhao: "",
        tipoMaterial: "",
        numViagens: 1,
      }));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title">Lançamento (Descarga)</h1>
          <p className="page-subtitle">Registre os lançamentos de material</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Novo Lançamento
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
              {!canEditDate && (
                <p className="text-xs text-muted-foreground">Data preenchida automaticamente</p>
              )}
            </div>

            {/* Local */}
            <div className="space-y-2">
              <Label htmlFor="local">Local de Descarga</Label>
              <Select
                value={formData.local}
                onValueChange={(value) => setFormData(prev => ({ ...prev, local: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {locaisDestino.map((local) => (
                    <SelectItem key={local.Nome} value={local.Nome}>
                      {local.Nome} - {local.Obra}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estaca */}
            <div className="space-y-2">
              <Label htmlFor="estaca">Estaca</Label>
              <Input
                id="estaca"
                value={formData.estaca}
                onChange={(e) => setFormData(prev => ({ ...prev, estaca: e.target.value }))}
                placeholder="Ex: 100+500"
              />
            </div>

            {/* Caminhão */}
            <div className="space-y-2">
              <Label htmlFor="caminhao">Caminhão</Label>
              <Select
                value={formData.caminhao}
                onValueChange={(value) => setFormData(prev => ({ ...prev, caminhao: value }))}
              >
                <SelectTrigger>
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
                <p className="text-xs text-muted-foreground">
                  Motorista: {caminhaoSelecionado.Motorista} | Volume: {caminhaoSelecionado.Volume}m³
                </p>
              )}
            </div>

            {/* Tipo de Material */}
            <div className="space-y-2">
              <Label htmlFor="tipoMaterial">Tipo de Material</Label>
              <Select
                value={formData.tipoMaterial}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoMaterial: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  {materiais?.filter(m => m.Ativo === 'Sim').map((mat) => (
                    <SelectItem key={mat.Nome} value={mat.Nome}>
                      {mat.Nome} ({mat.Unidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número de Viagens - Apenas para Sala Técnica/Admin */}
            {canSeeTrips && (
              <div className="space-y-2">
                <Label htmlFor="numViagens">Nº de Viagens</Label>
                <Input
                  id="numViagens"
                  type="number"
                  min={1}
                  value={formData.numViagens}
                  onChange={(e) => setFormData(prev => ({ ...prev, numViagens: parseInt(e.target.value) || 1 }))}
                />
              </div>
            )}

            {/* Botão Salvar */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Lançamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
