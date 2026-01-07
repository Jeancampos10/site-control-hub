import { FileText, Download, Calendar, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const relatorios = [
  {
    id: 1,
    titulo: "Relatório Diário por Escavadeira",
    descricao: "Detalhamento completo da produção diária de cada escavadeira, incluindo materiais, viagens e volumes",
    icone: "📊",
    formato: "PDF",
  },
  {
    id: 2,
    titulo: "Relatório de Materiais",
    descricao: "Resumo de movimentação por tipo de material (Rachão, Bota-fora, Argila, etc.)",
    icone: "📦",
    formato: "PDF / Excel",
  },
  {
    id: 3,
    titulo: "Relatório por Local",
    descricao: "Análise de produção por local de obra e estaca",
    icone: "📍",
    formato: "PDF",
  },
  {
    id: 4,
    titulo: "Relatório de Frota",
    descricao: "Status e produtividade de caminhões e equipamentos",
    icone: "🚚",
    formato: "PDF / Excel",
  },
  {
    id: 5,
    titulo: "Relatório de Apontadores",
    descricao: "Registros e produtividade por apontador de campo",
    icone: "👷",
    formato: "PDF",
  },
  {
    id: 6,
    titulo: "Relatório Gerencial",
    descricao: "Visão executiva com KPIs, tendências e análises comparativas",
    icone: "📈",
    formato: "PDF",
  },
];

export default function Relatorios() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" />
            Relatórios
          </h1>
          <p className="page-subtitle">
            Geração e exportação de relatórios operacionais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            07 Jan 2026
          </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatorios.map((relatorio) => (
          <Card
            key={relatorio.id}
            className="group cursor-pointer border-border/50 transition-all hover:border-accent/50 hover:shadow-card-hover"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{relatorio.icone}</span>
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {relatorio.formato}
                </span>
              </div>
              <CardTitle className="text-base">{relatorio.titulo}</CardTitle>
              <CardDescription className="text-sm">
                {relatorio.descricao}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 group-hover:border-accent group-hover:text-accent"
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="chart-container">
        <h3 className="mb-4 text-base font-semibold">Resumo do Dia - 07/01/2026</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Total de Viagens</p>
            <p className="text-2xl font-bold text-foreground">847</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Volume Total</p>
            <p className="text-2xl font-bold text-foreground">7.528 m³</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Escavadeiras</p>
            <p className="text-2xl font-bold text-foreground">5</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Caminhões</p>
            <p className="text-2xl font-bold text-foreground">18</p>
          </div>
        </div>
      </div>
    </div>
  );
}
