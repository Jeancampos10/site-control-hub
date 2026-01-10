import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Box, Building2 } from "lucide-react";
import { MaterialSummary, EmpresaSummary, FRETE_POR_TONELADA, DMT } from "./PedreiraSummaryCard";

export interface ExpandedPeriodSummaryProps {
  materialData: MaterialSummary[];
  empresaData: EmpresaSummary[];
  title: string;
  subtitle: string;
  colorScheme: 'blue' | 'amber' | 'emerald';
  icon: React.ReactNode;
  showCaminhoes?: boolean;
}

export const ExpandedPeriodSummaryCard = ({ 
  materialData, 
  empresaData, 
  title, 
  subtitle, 
  colorScheme, 
  icon, 
  showCaminhoes = false 
}: ExpandedPeriodSummaryProps) => {
  const totalViagens = materialData.reduce((sum, r) => sum + r.viagens, 0);
  const totalToneladas = materialData.reduce((sum, r) => sum + r.toneladas, 0);
  const totalFrete = totalToneladas * FRETE_POR_TONELADA * DMT;

  const colorClasses = {
    blue: {
      title: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-500 text-white',
    },
    amber: {
      title: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500 text-white',
    },
    emerald: {
      title: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-500 text-white',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h2 className={`text-2xl font-bold ${colors.title}`}>{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <span className={`${colors.badge} px-4 py-2 rounded-full text-lg font-bold`}>
          {totalViagens} viagens
        </span>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-4xl font-bold">{totalToneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
          <p className="text-base text-muted-foreground mt-2">Total Toneladas</p>
        </div>
        <div className="text-center p-6 bg-success/10 rounded-lg">
          <p className="text-4xl font-bold text-success">R$ {totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-base text-muted-foreground mt-2">Total Frete</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Material Summary */}
        <div>
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Box className="h-5 w-5" /> Por Material
          </h4>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2 px-3">Material</TableHead>
                  <TableHead className="py-2 px-3 text-right">Viagens</TableHead>
                  <TableHead className="py-2 px-3 text-right">Toneladas</TableHead>
                  <TableHead className="py-2 px-3 text-right">Frete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialData.length > 0 ? (
                  materialData.map((row) => (
                    <TableRow key={row.material}>
                      <TableCell className="py-2 px-3 font-medium">{row.material}</TableCell>
                      <TableCell className="py-2 px-3 text-right">{row.viagens}</TableCell>
                      <TableCell className="py-2 px-3 text-right">{row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t</TableCell>
                      <TableCell className="py-2 px-3 text-right text-success">R$ {row.frete.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Empresa Summary */}
        <div>
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Por Empresa
          </h4>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2 px-3">Empresa</TableHead>
                  {showCaminhoes && <TableHead className="py-2 px-3 text-right">Cam.</TableHead>}
                  <TableHead className="py-2 px-3 text-right">Viagens</TableHead>
                  <TableHead className="py-2 px-3 text-right">Toneladas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresaData.length > 0 ? (
                  empresaData.map((row) => (
                    <TableRow key={row.empresa}>
                      <TableCell className="py-2 px-3 font-medium">{row.empresa}</TableCell>
                      {showCaminhoes && <TableCell className="py-2 px-3 text-right">{row.caminhoes}</TableCell>}
                      <TableCell className="py-2 px-3 text-right">{row.viagens}</TableCell>
                      <TableCell className="py-2 px-3 text-right">{row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={showCaminhoes ? 4 : 3} className="text-center py-4">Sem dados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
