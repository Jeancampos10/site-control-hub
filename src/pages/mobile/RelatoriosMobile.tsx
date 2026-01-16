import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Calendar,
  Upload,
  Download,
  Mountain,
  Droplets,
  FlaskConical,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { cn } from "@/lib/utils";

export default function RelatoriosMobile() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { data: cargaData } = useGoogleSheets('carga');
  const { data: descargaData } = useGoogleSheets('descarga');
  const { data: pedreiraData } = useGoogleSheets('apontamento_pedreira');
  const { data: pipaData } = useGoogleSheets('apontamento_pipa');
  const { data: calData } = useGoogleSheets('mov_cal');

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  const stats = useMemo(() => ({
    cargas: filterByDate(cargaData, selectedDateObj).length,
    lancamentos: filterByDate(descargaData, selectedDateObj).length,
    pedreira: filterByDate(pedreiraData, selectedDateObj).length,
    pipas: filterByDate(pipaData, selectedDateObj).length,
    cal: filterByDate(calData, selectedDateObj).length,
  }), [cargaData, descargaData, pedreiraData, pipaData, calData, selectedDate]);

  const total = stats.cargas + stats.lancamentos + stats.pedreira + stats.pipas + stats.cal;

  const quickDates = [
    { label: 'Hoje', date: new Date() },
    { label: 'Ontem', date: subDays(new Date(), 1) },
    { label: '7 dias', date: subDays(new Date(), 7) },
  ];

  const categories = [
    { 
      id: 'apropriacao',
      title: 'Apropriação - Cargas', 
      count: stats.cargas, 
      icon: Upload, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      href: '/m/apropriacao/relatorios/carga'
    },
    { 
      id: 'lancamentos',
      title: 'Apropriação - Lançamentos', 
      count: stats.lancamentos, 
      icon: Download, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/m/apropriacao/relatorios/lancamento'
    },
    { 
      id: 'pedreira',
      title: 'Pedreira', 
      count: stats.pedreira, 
      icon: Mountain, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/m/pedreira/relatorio'
    },
    { 
      id: 'pipas',
      title: 'Pipas', 
      count: stats.pipas, 
      icon: Droplets, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/m/pipas/relatorio'
    },
    { 
      id: 'cal',
      title: 'CAL', 
      count: stats.cal, 
      icon: FlaskConical, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/m/cal/relatorio'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-primary px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={() => navigate('/m')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground">Relatórios</h1>
            <p className="text-xs text-primary-foreground/70">
              Histórico de Registros
            </p>
          </div>
          <Filter className="h-5 w-5 text-primary-foreground/80" />
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 pb-24">
        {/* Date Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Filtrar por Data</span>
            </div>
            <Input
              type="date"
              className="h-12 mb-3"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div className="flex gap-2">
              {quickDates.map((qd) => (
                <Button
                  key={qd.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(format(qd.date, 'yyyy-MM-dd'))}
                  className={cn(
                    "flex-1 text-xs",
                    format(qd.date, 'yyyy-MM-dd') === selectedDate && "bg-primary text-primary-foreground"
                  )}
                >
                  {qd.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-primary/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-primary-foreground">
                {format(selectedDateObj, "dd 'de' MMMM", { locale: ptBR })}
              </h4>
              <span className="text-2xl font-bold text-primary-foreground">{total}</span>
            </div>
            <p className="text-xs text-primary-foreground/70">
              Total de registros no período
            </p>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="space-y-2">
          <h3 className="font-bold text-foreground px-1">Por Categoria</h3>
          
          {categories.map((cat) => (
            <Link key={cat.id} to={cat.href}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", cat.bgColor)}>
                      <cat.icon className={cn("h-5 w-5", cat.color)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{cat.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {cat.count} registro{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-bold",
                        cat.count > 0 ? cat.color : "text-muted-foreground"
                      )}>
                        {cat.count}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {total === 0 && (
          <Card className="border-0 shadow-sm bg-slate-50">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">
                Nenhum registro encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                para {format(selectedDateObj, "dd/MM/yyyy")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
