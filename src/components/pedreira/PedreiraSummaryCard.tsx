import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Box, Building2, Maximize2 } from "lucide-react";

// Constants for freight calculation
export const FRETE_POR_TONELADA = 0.45;
export const DMT = 35;

export interface MaterialSummary {
  material: string;
  viagens: number;
  toneladas: number;
  frete: number;
}

export interface EmpresaSummary {
  empresa: string;
  caminhoes: number;
  viagens: number;
  toneladas: number;
  frete: number;
}

export interface PeriodSummaryProps {
  materialData: MaterialSummary[];
  empresaData: EmpresaSummary[];
  title: string;
  subtitle: string;
  colorScheme: 'blue' | 'amber' | 'emerald';
  icon: React.ReactNode;
  showCaminhoes?: boolean;
  onExpand?: () => void;
}

export const PeriodSummaryCard = ({ 
  materialData, 
  empresaData, 
  title, 
  subtitle, 
  colorScheme, 
  icon, 
  showCaminhoes = false, 
  onExpand 
}: PeriodSummaryProps) => {
  const totalViagens = materialData.reduce((sum, r) => sum + r.viagens, 0);
  const totalToneladas = materialData.reduce((sum, r) => sum + r.toneladas, 0);
  const totalFrete = totalToneladas * FRETE_POR_TONELADA * DMT;

  const colorClasses = {
    blue: {
      border: 'border-l-4 border-l-blue-500',
      header: 'bg-blue-500/10',
      title: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-500 text-white',
    },
    amber: {
      border: 'border-l-4 border-l-amber-500',
      header: 'bg-amber-500/10',
      title: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500 text-white',
    },
    emerald: {
      border: 'border-l-4 border-l-emerald-500',
      header: 'bg-emerald-500/10',
      title: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-500 text-white',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <Card 
      className={`${colors.border} overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]`}
      onClick={onExpand}
    >
      <CardHeader className={`${colors.header} pb-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className={`text-lg font-bold ${colors.title}`}>{title}</CardTitle>
              <CardDescription className="text-xs">{subtitle}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${colors.badge} px-3 py-1 rounded-full text-sm font-bold`}>
              {totalViagens} viagens
            </span>
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{totalToneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Total Toneladas</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <p className="text-2xl font-bold text-success">R$ {totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">Total Frete</p>
          </div>
        </div>

        {/* Material Summary */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <Box className="h-3 w-3" /> Por Material
          </h4>
          <div className="overflow-x-auto max-h-32 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-1 px-2">Material</TableHead>
                  <TableHead className="py-1 px-2 text-right">Viagens</TableHead>
                  <TableHead className="py-1 px-2 text-right">Ton</TableHead>
                  <TableHead className="py-1 px-2 text-right">Frete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialData.length > 0 ? (
                  materialData.map((row) => (
                    <TableRow key={row.material} className="text-xs">
                      <TableCell className="py-1 px-2 font-medium">{row.material}</TableCell>
                      <TableCell className="py-1 px-2 text-right">{row.viagens}</TableCell>
                      <TableCell className="py-1 px-2 text-right">{row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t</TableCell>
                      <TableCell className="py-1 px-2 text-right text-success">R$ {row.frete.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center text-xs py-2">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Empresa Summary */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Por Empresa
          </h4>
          <div className="overflow-x-auto max-h-32 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-1 px-2">Empresa</TableHead>
                  {showCaminhoes && <TableHead className="py-1 px-2 text-right">Cam.</TableHead>}
                  <TableHead className="py-1 px-2 text-right">Viagens</TableHead>
                  <TableHead className="py-1 px-2 text-right">Ton</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresaData.length > 0 ? (
                  empresaData.map((row) => (
                    <TableRow key={row.empresa} className="text-xs">
                      <TableCell className="py-1 px-2 font-medium">{row.empresa}</TableCell>
                      {showCaminhoes && <TableCell className="py-1 px-2 text-right">{row.caminhoes}</TableCell>}
                      <TableCell className="py-1 px-2 text-right">{row.viagens}</TableCell>
                      <TableCell className="py-1 px-2 text-right">{row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={showCaminhoes ? 4 : 3} className="text-center text-xs py-2">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
