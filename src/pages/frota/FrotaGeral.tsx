import { useMemo } from "react";
import { Car, HardHat, Truck, Droplets, Building2 } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { useGoogleSheets, EquipamentoRow, CaminhaoRow, CamReboqueRow, CaminhaoPipaRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmpresaSummary {
  empresa: string;
  equipamentos: number;
  caminhoes: number;
  reboques: number;
  pipas: number;
  total: number;
}

interface DescricaoSummary {
  descricao: string;
  quantidade: number;
  tipo: string;
}

export default function FrotaGeral() {
  const { data: equipamentosData, isLoading: loadingEq, error: errorEq } = useGoogleSheets<EquipamentoRow>('equipamentos');
  const { data: caminhoesData, isLoading: loadingCam, error: errorCam } = useGoogleSheets<CaminhaoRow>('caminhao');
  const { data: reboqueData, isLoading: loadingReb, error: errorReb } = useGoogleSheets<CamReboqueRow>('cam_reboque');
  const { data: pipaData, isLoading: loadingPipa, error: errorPipa } = useGoogleSheets<CaminhaoPipaRow>('caminhao_pipa');

  const isLoading = loadingEq || loadingCam || loadingReb || loadingPipa;
  const hasError = errorEq || errorCam || errorReb || errorPipa;

  // Total counts
  const totalEquipamentos = equipamentosData?.length || 0;
  const totalCaminhoes = caminhoesData?.length || 0;
  const totalReboques = reboqueData?.length || 0;
  const totalPipas = pipaData?.length || 0;
  const totalGeral = totalEquipamentos + totalCaminhoes + totalReboques + totalPipas;

  // Group by Empresa
  const empresaSummary = useMemo((): EmpresaSummary[] => {
    const grouped = new Map<string, EmpresaSummary>();

    const addToGroup = (empresa: string, type: 'equipamentos' | 'caminhoes' | 'reboques' | 'pipas') => {
      const key = empresa?.trim() || 'Não informado';
      if (!grouped.has(key)) {
        grouped.set(key, { empresa: key, equipamentos: 0, caminhoes: 0, reboques: 0, pipas: 0, total: 0 });
      }
      const summary = grouped.get(key)!;
      summary[type]++;
      summary.total++;
    };

    (equipamentosData || []).forEach(eq => addToGroup(eq.Empresa_Eq, 'equipamentos'));
    (caminhoesData || []).forEach(cam => addToGroup(cam.Empresa_Cb, 'caminhoes'));
    (reboqueData || []).forEach(reb => addToGroup(reb.Empresa_Cb || reb.Empresa, 'reboques'));
    (pipaData || []).forEach(pipa => addToGroup(pipa.Empresa, 'pipas'));

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [equipamentosData, caminhoesData, reboqueData, pipaData]);

  // Group by Descrição
  const descricaoSummary = useMemo((): DescricaoSummary[] => {
    const grouped = new Map<string, DescricaoSummary>();

    const addToGroup = (descricao: string, tipo: string) => {
      const key = `${tipo}:${descricao?.trim() || 'Não informado'}`;
      if (!grouped.has(key)) {
        grouped.set(key, { descricao: descricao?.trim() || 'Não informado', quantidade: 0, tipo });
      }
      grouped.get(key)!.quantidade++;
    };

    (equipamentosData || []).forEach(eq => addToGroup(eq.Descricao_Eq, 'Equipamento'));
    (caminhoesData || []).forEach(cam => addToGroup(cam.Descricao_Cb, 'Caminhão'));
    (reboqueData || []).forEach(reb => addToGroup(reb.Descricao, 'Reboque'));
    (pipaData || []).forEach(pipa => addToGroup(pipa.Descricao, 'Pipa'));

    return Array.from(grouped.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [equipamentosData, caminhoesData, reboqueData, pipaData]);

  if (hasError) {
    return (
      <div className="p-6">
        <ErrorState message="Erro ao carregar dados da frota" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          Frota Geral
        </h1>
        <p className="page-subtitle">
          Resumo geral de todos os equipamentos e veículos
        </p>
      </div>

      {isLoading ? (
        <TableLoader />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total Geral com destaque */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-90">Total Geral</p>
                  <p className="text-3xl font-bold tracking-tight">{totalGeral}</p>
                  <p className="text-xs opacity-80">Todos os tipos</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
                  <Car className="h-5 w-5" />
                </div>
              </div>
            </div>
            <KPICard
              title="Equipamentos"
              value={totalEquipamentos}
              subtitle="Escavadeiras"
              icon={HardHat}
              variant="accent"
            />
            <KPICard
              title="Caminhões"
              value={totalCaminhoes}
              subtitle="Basculantes"
              icon={Truck}
              variant="success"
            />
            <KPICard
              title="Reboques"
              value={totalReboques}
              subtitle="Carretas"
              icon={Truck}
              variant="default"
            />
            <KPICard
              title="Pipas"
              value={totalPipas}
              subtitle="Caminhões Pipa"
              icon={Droplets}
              variant="primary"
            />
          </div>

          {/* Tables Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Agrupado por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="data-table-header">Empresa</TableHead>
                        <TableHead className="data-table-header text-center">Equip.</TableHead>
                        <TableHead className="data-table-header text-center">Cam.</TableHead>
                        <TableHead className="data-table-header text-center">Reb.</TableHead>
                        <TableHead className="data-table-header text-center">Pipas</TableHead>
                        <TableHead className="data-table-header text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresaSummary.length > 0 ? (
                        empresaSummary.map((row) => (
                          <TableRow key={row.empresa} className="data-table-row">
                            <TableCell className="font-medium">{row.empresa}</TableCell>
                            <TableCell className="text-center">{row.equipamentos || '-'}</TableCell>
                            <TableCell className="text-center">{row.caminhoes || '-'}</TableCell>
                            <TableCell className="text-center">{row.reboques || '-'}</TableCell>
                            <TableCell className="text-center">{row.pipas || '-'}</TableCell>
                            <TableCell className="text-right font-bold">{row.total}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* By Descrição */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardHat className="h-5 w-5" />
                  Agrupado por Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="data-table-header">Descrição</TableHead>
                        <TableHead className="data-table-header">Tipo</TableHead>
                        <TableHead className="data-table-header text-right">Qtd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {descricaoSummary.length > 0 ? (
                        descricaoSummary.map((row, idx) => (
                          <TableRow key={idx} className="data-table-row">
                            <TableCell className="font-medium">{row.descricao}</TableCell>
                            <TableCell>
                              <span className="status-badge bg-muted text-muted-foreground">
                                {row.tipo}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">{row.quantidade}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
