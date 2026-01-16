import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, Plus, Loader2, Mountain } from "lucide-react";
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
  caminhao: string;
  horaCarregamento: string;
  numeroPedido: string;
  pesoFinal: number;
  pesoLiquido: number;
  tipoMaterial: string;
}

export default function ApontadorPedreira() {
  const { canEditDate } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  // Carregar dados das planilhas
  const { data: caminhoes } = useGoogleSheets<Record<string, string>>('cam_reboque');
  const { data: materiais } = useGoogleSheets<Record<string, string>>('materiais');

  const [formData, setFormData] = useState<FormData>({
    data: new Date(),
    caminhao: "",
    horaCarregamento: format(new Date(), 'HH:mm'),
    numeroPedido: "",
    pesoFinal: 0,
    pesoLiquido: 0,
    tipoMaterial: "",
  });

  // Dados automáticos quando seleciona um caminhão
  const caminhaoSelecionado = useMemo(() => {
    return caminhoes?.find(c => c.Prefixo === formData.caminhao);
  }, [caminhoes, formData.caminhao]);

  // Calcular peso líquido automaticamente
  const pesoVazio = useMemo(() => {
    return parseFloat(caminhaoSelecionado?.['Peso Vazio'] || '0') || 0;
  }, [caminhaoSelecionado]);

  const handlePesoFinalChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      pesoFinal: value,
      pesoLiquido: value - pesoVazio
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pedreiraData = {
        Data: format(formData.data, 'dd/MM/yyyy'),
        Caminhão: formData.caminhao,
        Motorista: caminhaoSelecionado?.Motorista || '',
        Empresa: caminhaoSelecionado?.Empresa || '',
        Placa: caminhaoSelecionado?.Placa || '',
        'Hora Carregamento': formData.horaCarregamento,
        'Nº Pedido': formData.numeroPedido,
        'Peso Vazio': pesoVazio,
        'Peso Final': formData.pesoFinal,
        'Peso Líquido': formData.pesoLiquido,
        'Tipo Material': formData.tipoMaterial,
      };

      console.log('Salvando carregamento pedreira:', pedreiraData);
      
      toast.success("Carregamento da pedreira registrado com sucesso!");
      
      // Limpar formulário
      setFormData(prev => ({
        ...prev,
        caminhao: "",
        horaCarregamento: format(new Date(), 'HH:mm'),
        numeroPedido: "",
        pesoFinal: 0,
        pesoLiquido: 0,
        tipoMaterial: "",
      }));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao registrar carregamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title">Apontar Carregamento - Pedreira</h1>
          <p className="page-subtitle">Registre os carregamentos de material da pedreira</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mountain className="h-5 w-5 text-accent" />
              Novo Carregamento
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
                      {cam.Prefixo} - {cam.Placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {caminhaoSelecionado && (
                <p className="text-xs text-muted-foreground">
                  Motorista: {caminhaoSelecionado.Motorista} | Empresa: {caminhaoSelecionado.Empresa} | Peso Vazio: {pesoVazio}kg
                </p>
              )}
            </div>

            {/* Hora de Carregamento */}
            <div className="space-y-2">
              <Label htmlFor="horaCarregamento">Hora de Carregamento</Label>
              <Input
                id="horaCarregamento"
                type="time"
                value={formData.horaCarregamento}
                onChange={(e) => setFormData(prev => ({ ...prev, horaCarregamento: e.target.value }))}
              />
            </div>

            {/* Número do Pedido */}
            <div className="space-y-2">
              <Label htmlFor="numeroPedido">Nº do Pedido</Label>
              <Input
                id="numeroPedido"
                value={formData.numeroPedido}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroPedido: e.target.value }))}
                placeholder="Digite o número do pedido"
              />
            </div>

            {/* Peso Final */}
            <div className="space-y-2">
              <Label htmlFor="pesoFinal">Peso Final (kg)</Label>
              <Input
                id="pesoFinal"
                type="number"
                min={0}
                value={formData.pesoFinal || ''}
                onChange={(e) => handlePesoFinalChange(parseFloat(e.target.value) || 0)}
                placeholder="Digite o peso final"
              />
            </div>

            {/* Peso Líquido (calculado) */}
            <div className="space-y-2">
              <Label htmlFor="pesoLiquido">Peso Líquido (kg)</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium">
                {formData.pesoLiquido.toLocaleString('pt-BR')} kg
              </div>
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente: Peso Final - Peso Vazio
              </p>
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
                      {mat.Nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  Salvar Carregamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
