import { useMemo } from "react";
import { ApontamentoPedreiraRow, CamReboqueRow, filterByDate } from "@/hooks/useGoogleSheets";
import { startOfMonth, isWithinInterval } from "date-fns";
import { parsePtBrNumber } from "@/lib/utils";
import { MaterialSummary, EmpresaSummary, FRETE_POR_TONELADA, DMT } from "./PedreiraSummaryCard";

// Helper to parse Brazilian date to Date object
export const parsePtBrDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

interface CompanySummary {
  empresa: string;
  caminhoes: number;
  viagens: number;
}

export const usePedreiraData = (
  allData: ApontamentoPedreiraRow[] | undefined,
  reboqueData: CamReboqueRow[] | undefined,
  selectedDate: Date
) => {
  // Total mobilizado (reboques cadastrados)
  const totalMobilizado = reboqueData?.length || 0;

  // Filter data by selected date
  const pedreiraData = useMemo(() => {
    return filterByDate(allData, selectedDate);
  }, [allData, selectedDate]);

  // Filter data for current month (up to yesterday)
  const pedreiraDataMes = useMemo(() => {
    if (!allData) return [];
    const monthStart = startOfMonth(selectedDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return allData.filter(row => {
      const rowDate = parsePtBrDate(row.Data);
      if (!rowDate) return false;
      return isWithinInterval(rowDate, { start: monthStart, end: yesterday });
    });
  }, [allData, selectedDate]);

  // Calculate KPIs from filtered data (day)
  const totalRegistros = pedreiraData?.length || 0;
  const pesoTotal = pedreiraData?.reduce((acc, row) => acc + parsePtBrNumber(row.Tonelada), 0) || 0;
  const veiculosAtivos = new Set(pedreiraData?.map(row => row.Prefixo_Eq).filter(Boolean)).size;

  // Summary by material for each period
  const createMaterialSummary = (data: ApontamentoPedreiraRow[] | undefined): MaterialSummary[] => {
    if (!data) return [];
    
    const grouped = new Map<string, MaterialSummary>();
    
    data.forEach(row => {
      const material = row.Material || 'Outros';
      const toneladas = parsePtBrNumber(row.Tonelada);
      
      if (!grouped.has(material)) {
        grouped.set(material, { material, viagens: 0, toneladas: 0, frete: 0 });
      }
      
      const summary = grouped.get(material)!;
      summary.viagens += 1;
      summary.toneladas += toneladas;
      summary.frete = summary.toneladas * FRETE_POR_TONELADA * DMT;
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.toneladas - a.toneladas);
  };

  // Summary by empresa for each period
  const createEmpresaSummary = (data: ApontamentoPedreiraRow[] | undefined): EmpresaSummary[] => {
    if (!data) return [];
    
    const grouped = new Map<string, { trucks: Set<string>; viagens: number; toneladas: number }>();
    
    data.forEach(row => {
      const empresa = row.Empresa_Eq || row.Fornecedor || 'Outros';
      const toneladas = parsePtBrNumber(row.Tonelada);
      
      if (!grouped.has(empresa)) {
        grouped.set(empresa, { trucks: new Set(), viagens: 0, toneladas: 0 });
      }
      
      const summary = grouped.get(empresa)!;
      summary.viagens += 1;
      summary.toneladas += toneladas;
      if (row.Prefixo_Eq) summary.trucks.add(row.Prefixo_Eq);
    });
    
    return Array.from(grouped.entries()).map(([empresa, data]) => ({
      empresa,
      caminhoes: data.trucks.size,
      viagens: data.viagens,
      toneladas: data.toneladas,
      frete: data.toneladas * FRETE_POR_TONELADA * DMT,
    })).sort((a, b) => b.viagens - a.viagens);
  };

  const materialSummaryPeriodo = useMemo(() => createMaterialSummary(allData), [allData]);
  const materialSummaryMes = useMemo(() => createMaterialSummary(pedreiraDataMes), [pedreiraDataMes]);
  const materialSummaryDia = useMemo(() => createMaterialSummary(pedreiraData), [pedreiraData]);

  const empresaSummaryPeriodo = useMemo(() => createEmpresaSummary(allData), [allData]);
  const empresaSummaryMes = useMemo(() => createEmpresaSummary(pedreiraDataMes), [pedreiraDataMes]);
  const empresaSummaryDia = useMemo(() => createEmpresaSummary(pedreiraData), [pedreiraData]);

  // Summary by company (truck companies like Engemat, L. Pereira)
  const companySummary = useMemo((): CompanySummary[] => {
    if (!pedreiraData) return [];
    
    const grouped = new Map<string, { trucks: Set<string>; viagens: number }>();
    
    pedreiraData.forEach(row => {
      const empresa = row.Empresa_Eq || row.Fornecedor || 'Outros';
      
      if (!grouped.has(empresa)) {
        grouped.set(empresa, { trucks: new Set(), viagens: 0 });
      }
      
      const summary = grouped.get(empresa)!;
      summary.viagens += 1;
      if (row.Prefixo_Eq) summary.trucks.add(row.Prefixo_Eq);
    });
    
    return Array.from(grouped.entries()).map(([empresa, data]) => ({
      empresa,
      caminhoes: data.trucks.size,
      viagens: data.viagens,
    })).sort((a, b) => b.viagens - a.viagens);
  }, [pedreiraData]);

  return {
    pedreiraData,
    pedreiraDataMes,
    totalMobilizado,
    totalRegistros,
    pesoTotal,
    veiculosAtivos,
    materialSummaryPeriodo,
    materialSummaryMes,
    materialSummaryDia,
    empresaSummaryPeriodo,
    empresaSummaryMes,
    empresaSummaryDia,
    companySummary,
  };
};
