import { HardHat, Truck, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CargaRow } from "@/hooks/useGoogleSheets";

interface EmpresaDetail {
  empresa: string;
  equipamentos: Array<{
    prefixo: string;
    descricao: string;
    operador: string;
    viagens: number;
  }>;
  caminhoes: Array<{
    prefixo: string;
    descricao: string;
    motorista: string;
    viagens: number;
  }>;
}

interface EmpresaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: string | null;
  cargaData: CargaRow[];
}

export function EmpresaDetailDialog({
  open,
  onOpenChange,
  empresa,
  cargaData,
}: EmpresaDetailDialogProps) {
  if (!empresa) return null;

  // Calcular detalhes dos equipamentos da empresa
  const equipamentosMap = new Map<string, { 
    prefixo: string; 
    descricao: string; 
    operador: string; 
    viagens: number 
  }>();

  // Calcular detalhes dos caminhões da empresa
  const caminhoesMap = new Map<string, { 
    prefixo: string; 
    descricao: string; 
    motorista: string; 
    viagens: number 
  }>();

  cargaData.forEach(row => {
    // Equipamentos
    if (row.Empresa_Eq === empresa && row.Prefixo_Eq) {
      const existing = equipamentosMap.get(row.Prefixo_Eq);
      const viagens = parseInt(row.N_Viagens) || 1;
      if (existing) {
        existing.viagens += viagens;
      } else {
        equipamentosMap.set(row.Prefixo_Eq, {
          prefixo: row.Prefixo_Eq,
          descricao: row.Descricao_Eq || '-',
          operador: row.Operador || '-',
          viagens,
        });
      }
    }

    // Caminhões
    if (row.Empresa_Cb === empresa && row.Prefixo_Cb) {
      const existing = caminhoesMap.get(row.Prefixo_Cb);
      const viagens = parseInt(row.N_Viagens) || 1;
      if (existing) {
        existing.viagens += viagens;
      } else {
        caminhoesMap.set(row.Prefixo_Cb, {
          prefixo: row.Prefixo_Cb,
          descricao: row.Descricao_Cb || '-',
          motorista: row.Motorista || '-',
          viagens,
        });
      }
    }
  });

  const equipamentos = Array.from(equipamentosMap.values()).sort((a, b) => b.viagens - a.viagens);
  const caminhoes = Array.from(caminhoesMap.values()).sort((a, b) => b.viagens - a.viagens);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{empresa}</span>
            <Badge variant="secondary" className="ml-2">
              {equipamentos.length} equipamentos • {caminhoes.length} caminhões
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Equipamentos */}
            {equipamentos.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
                  <HardHat className="h-4 w-4 text-primary" />
                  Equipamentos ({equipamentos.length})
                </h3>
                <div className="space-y-2">
                  {equipamentos.map((eq) => (
                    <div
                      key={eq.prefixo}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{eq.prefixo}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {eq.descricao}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <User className="h-3 w-3" />
                          {eq.operador}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {eq.viagens} viagens
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caminhões */}
            {caminhoes.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-sm mb-3">
                  <Truck className="h-4 w-4 text-primary" />
                  Caminhões ({caminhoes.length})
                </h3>
                <div className="space-y-2">
                  {caminhoes.map((cb) => (
                    <div
                      key={cb.prefixo}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{cb.prefixo}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {cb.descricao}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <User className="h-3 w-3" />
                          {cb.motorista}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {cb.viagens} viagens
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {equipamentos.length === 0 && caminhoes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado encontrado para esta empresa no dia selecionado.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
