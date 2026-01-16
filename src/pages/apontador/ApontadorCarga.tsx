import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { DateFilter } from "@/components/shared/DateFilter";

interface FormData {
  data: Date;
  local: string;
  estaca: string;
  escavadeira: string;
  caminhao: string;
  tipoMaterial: string;
  numViagens: number;
  adicionarLancamento: boolean;
  localLancamento: string;
}

export default function ApontadorCarga() {
  const { canEditDate, canSeeTrips, isSalaTecnica } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  // Carregar dados das planilhas
  const { data: escavadeiras } = useGoogleSheets<Record<string, string>>('escavadeiras');
  const { data: caminhoes } = useGoogleSheets<Record<string, string>>('caminhao');
  const { data: locais } = useGoogleSheets<Record<string, string>>('locais');
  const { data: materiais } = useGoogleSheets<Record<string, string>>('materiais');

  const [formData, setFormData] = useState<FormData>({
    data: new Date(),
    local: "",
    estaca: "",
    escavadeira: "",
    caminhao: "",
    tipoMaterial: "",
    numViagens: 1,
    adicionarLancamento: false,
    localLancamento: "",
  });

  // Dados automáticos quando seleciona um equipamento
  const escavadeiraSelecionada = useMemo(() => {
    return escavadeiras?.find(e => e.Prefixo === formData.escavadeira);
  }, [escavadeiras, formData.escavadeira]);

  const caminhaoSelecionado = useMemo(() => {
    return caminhoes?.find(c => c.Prefixo === formData.caminhao);
  }, [caminhoes, formData.caminhao]);

  // Locais de origem e destino
  const locaisOrigem = useMemo(() => {
    return locais?.filter(l => l.Tipo === 'Origem' && l.Ativo === 'Sim') || [];
  }, [locais]);

  const locaisDestino = useMemo(() => {
    return locais?.filter(l => l.Tipo === 'Destino' && l.Ativo === 'Sim') || [];
  }, [locais]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar dados para enviar
      const cargaData = {
        Data: format(formData.data, 'dd/MM/yyyy'),
        Local: formData.local,
        Estaca: formData.estaca,
        Escavadeira: formData.escavadeira,
        'Operador Escavadeira': escavadeiraSelecionada?.Operador || '',
        'Empresa Escavadeira': escavadeiraSelecionada?.Empresa || '',
        Caminhão: formData.caminhao,
        Motorista: caminhaoSelecionado?.Motorista || '',
        'Empresa Caminhão': caminhaoSelecionado?.Empresa || '',
        Volume: caminhaoSelecionado?.Volume || '',
        'Tipo Material': formData.tipoMaterial,
        'Nº Viagens': formData.numViagens,
      };

      console.log('Salvando carga:', cargaData);
      
      // Se adicionarLancamento estiver ativo, também criar registro de descarga
      if (formData.adicionarLancamento && formData.localLancamento) {
        const descargaData = {
          ...cargaData,
          'Local Descarga': formData.localLancamento,
        };
        console.log('Também salvando lançamento:', descargaData);
      }

      toast.success("Apontamento de carga registrado com sucesso!");
      
      // Limpar formulário
      setFormData(prev => ({
        ...prev,
        local: "",
        estaca: "",
        escavadeira: "",
        caminhao: "",
        tipoMaterial: "",
        numViagens: 1,
        adicionarLancamento: false,
        localLancamento: "",
      }));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao registrar apontamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title">Apontar Carga</h1>
          <p className="page-subtitle">Registre as cargas de material na obra</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Novo Apontamento de Carga
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
              <Label htmlFor="local">Local de Carga</Label>
              <Select
                value={formData.local}
                onValueChange={(value) => setFormData(prev => ({ ...prev, local: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {locaisOrigem.map((local) => (
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

            {/* Escavadeira */}
            <div className="space-y-2">
              <Label htmlFor="escavadeira">Escavadeira</Label>
              <Select
                value={formData.escavadeira}
                onValueChange={(value) => setFormData(prev => ({ ...prev, escavadeira: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escavadeira" />
                </SelectTrigger>
                <SelectContent>
                  {escavadeiras?.map((esc) => (
                    <SelectItem key={esc.Prefixo} value={esc.Prefixo}>
                      {esc.Prefixo} - {esc.Empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {escavadeiraSelecionada && (
                <p className="text-xs text-muted-foreground">
                  Operador: {escavadeiraSelecionada.Operador} | Empresa: {escavadeiraSelecionada.Empresa}
                </p>
              )}
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

            <Separator />

            {/* Adicionar Lançamento */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="adicionarLancamento" className="text-base">
                  Adicionar Lançamento
                </Label>
                <p className="text-sm text-muted-foreground">
                  Registrar também o local de descarga
                </p>
              </div>
              <Switch
                id="adicionarLancamento"
                checked={formData.adicionarLancamento}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adicionarLancamento: checked }))}
              />
            </div>

            {/* Local de Lançamento (condicional) */}
            {formData.adicionarLancamento && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="localLancamento">Local de Lançamento</Label>
                <Select
                  value={formData.localLancamento}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, localLancamento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local de descarga" />
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
                  Salvar Apontamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
