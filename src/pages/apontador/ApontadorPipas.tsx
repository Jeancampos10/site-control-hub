import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, Plus, Loader2, Droplets } from "lucide-react";
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
  veiculo: string;
  horaChegada: string;
  horaSaida: string;
  numViagens: number;
}

export default function ApontadorPipas() {
  const { canEditDate, canSeeTrips } = usePermissions();
  const [loading, setLoading] = useState(false);
  
  // Carregar dados das planilhas
  const { data: veiculos } = useGoogleSheets<Record<string, string>>('caminhao_pipa');

  const [formData, setFormData] = useState<FormData>({
    data: new Date(),
    veiculo: "",
    horaChegada: format(new Date(), 'HH:mm'),
    horaSaida: "",
    numViagens: 1,
  });

  // Dados automáticos quando seleciona um veículo
  const veiculoSelecionado = useMemo(() => {
    return veiculos?.find(v => v.Prefixo === formData.veiculo);
  }, [veiculos, formData.veiculo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Para apontador, salvar automaticamente numViagens = 1
      const viagensParaSalvar = canSeeTrips ? formData.numViagens : 1;

      const pipaData = {
        Data: format(formData.data, 'dd/MM/yyyy'),
        Veículo: formData.veiculo,
        Motorista: veiculoSelecionado?.Motorista || '',
        Empresa: veiculoSelecionado?.Empresa || '',
        Capacidade: veiculoSelecionado?.Capacidade || '',
        'Hora Chegada': formData.horaChegada,
        'Hora Saída': formData.horaSaida,
        'Nº Viagens': viagensParaSalvar,
      };

      console.log('Salvando apontamento pipa:', pipaData);
      
      toast.success("Viagem do pipa registrada com sucesso!");
      
      // Limpar formulário
      setFormData(prev => ({
        ...prev,
        veiculo: "",
        horaChegada: format(new Date(), 'HH:mm'),
        horaSaida: "",
        numViagens: 1,
      }));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao registrar viagem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title">Apontar Viagens - Pipas</h1>
          <p className="page-subtitle">Registre as viagens dos caminhões pipa</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-info" />
              Nova Viagem
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

            {/* Veículo */}
            <div className="space-y-2">
              <Label htmlFor="veiculo">Veículo</Label>
              <Select
                value={formData.veiculo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, veiculo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {veiculos?.map((v) => (
                    <SelectItem key={v.Prefixo} value={v.Prefixo}>
                      {v.Prefixo} - {v.Descrição || v.Empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {veiculoSelecionado && (
                <p className="text-xs text-muted-foreground">
                  Motorista: {veiculoSelecionado.Motorista} | Capacidade: {veiculoSelecionado.Capacidade}L
                </p>
              )}
            </div>

            {/* Hora de Chegada */}
            <div className="space-y-2">
              <Label htmlFor="horaChegada">Hora de Chegada</Label>
              <Input
                id="horaChegada"
                type="time"
                value={formData.horaChegada}
                onChange={(e) => setFormData(prev => ({ ...prev, horaChegada: e.target.value }))}
              />
            </div>

            {/* Hora de Saída */}
            <div className="space-y-2">
              <Label htmlFor="horaSaida">Hora de Saída</Label>
              <Input
                id="horaSaida"
                type="time"
                value={formData.horaSaida}
                onChange={(e) => setFormData(prev => ({ ...prev, horaSaida: e.target.value }))}
              />
            </div>

            {/* Número de Viagens - Apenas para Sala Técnica/Admin */}
            {canSeeTrips ? (
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
            ) : (
              <p className="text-xs text-muted-foreground italic">
                O número de viagens será registrado automaticamente como 1.
              </p>
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
                  Salvar Viagem
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
