import { Truck, Box, HardHat, MapPin, Activity, Package } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { LocalChart } from "@/components/dashboard/LocalChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DataTable } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";

const materialByExcavatorData = [
  { escavadeira: "EX-001", rachao: "145 m³", botafora: "98 m³", argila: "52 m³", total: "295 m³" },
  { escavadeira: "EX-002", rachao: "132 m³", botafora: "87 m³", argila: "65 m³", total: "284 m³" },
  { escavadeira: "EX-003", rachao: "178 m³", botafora: "124 m³", argila: "41 m³", total: "343 m³" },
  { escavadeira: "EX-004", rachao: "95 m³", botafora: "112 m³", argila: "78 m³", total: "285 m³" },
  { escavadeira: "EX-005", rachao: "156 m³", botafora: "76 m³", argila: "89 m³", total: "321 m³" },
];

const materialColumns = [
  { key: "escavadeira", label: "Escavadeira" },
  { key: "rachao", label: "Rachão", className: "text-right" },
  { key: "botafora", label: "Bota-fora", className: "text-right" },
  { key: "argila", label: "Argila", className: "text-right" },
  { key: "total", label: "Total", className: "text-right font-semibold" },
];

const locationByExcavatorData = [
  { escavadeira: "EX-001", norte: "180 m³", central: "75 m³", estaca: "40 m³", total: "295 m³" },
  { escavadeira: "EX-002", norte: "120 m³", central: "104 m³", estaca: "60 m³", total: "284 m³" },
  { escavadeira: "EX-003", norte: "215 m³", central: "88 m³", estaca: "40 m³", total: "343 m³" },
  { escavadeira: "EX-004", norte: "85 m³", central: "140 m³", estaca: "60 m³", total: "285 m³" },
  { escavadeira: "EX-005", norte: "165 m³", central: "96 m³", estaca: "60 m³", total: "321 m³" },
];

const locationColumns = [
  { key: "escavadeira", label: "Escavadeira" },
  { key: "norte", label: "Trecho Norte", className: "text-right" },
  { key: "central", label: "Aterro Central", className: "text-right" },
  { key: "estaca", label: "Estaca 120-150", className: "text-right" },
  { key: "total", label: "Total", className: "text-right font-semibold" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Geral</h1>
        <p className="page-subtitle">
          Visão executiva das operações de terraplenagem em tempo real
        </p>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Total de Viagens"
          value="847"
          subtitle="Hoje"
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
          variant="accent"
        />
        <KPICard
          title="Volume Total"
          value="7.528 m³"
          subtitle="Movimentado"
          icon={Box}
          trend={{ value: 8, isPositive: true }}
          variant="primary"
        />
        <KPICard
          title="Escavadeiras Ativas"
          value="5"
          subtitle="de 6 disponíveis"
          icon={HardHat}
          variant="success"
        />
        <KPICard
          title="Caminhões Ativos"
          value="18"
          subtitle="de 22 disponíveis"
          icon={Truck}
          variant="default"
        />
        <KPICard
          title="Materiais do Dia"
          value="4"
          subtitle="Tipos diferentes"
          icon={Package}
          variant="default"
        />
        <KPICard
          title="Locais Ativos"
          value="3"
          subtitle="Em operação"
          icon={MapPin}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProductionChart />
        <LocalChart />
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable
          title="Escavadeira × Material"
          subtitle="Produção por tipo de material"
          columns={materialColumns}
          data={materialByExcavatorData}
        />
        <DataTable
          title="Escavadeira × Local"
          subtitle="Produção por área de trabalho"
          columns={locationColumns}
          data={locationByExcavatorData}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
