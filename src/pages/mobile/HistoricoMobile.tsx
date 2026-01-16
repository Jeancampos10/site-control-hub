import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isToday, isYesterday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Edit2, 
  Calendar, 
  Search,
  Truck,
  Package,
  Clock,
  MapPin,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { cn } from "@/lib/utils";
import { EditApontamentoDialog } from "@/components/mobile/EditApontamentoDialog";

interface ApontamentoItem {
  id: string;
  type: 'carga' | 'pedreira' | 'pipa' | 'cal';
  date: string;
  time: string;
  description: string;
  details: string;
  rawData: Record<string, unknown>;
}

export default function HistoricoMobile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [editingItem, setEditingItem] = useState<ApontamentoItem | null>(null);

  const { data: cargaData } = useGoogleSheets('carga');
  const { data: pedreiraData } = useGoogleSheets('apontamento_pedreira');
  const { data: pipaData } = useGoogleSheets('apontamento_pipa');
  const { data: calData } = useGoogleSheets('mov_cal');

  // Combine all data sources
  const allItems = useMemo(() => {
    const items: ApontamentoItem[] = [];

    // Carga items
    cargaData?.forEach((item: Record<string, unknown>) => {
      items.push({
        id: String(item.ID || item.id || Math.random()),
        type: 'carga',
        date: String(item.Data || ''),
        time: String(item.Hora || ''),
        description: `${item.Caminhao || ''} - ${item.Material || ''}`,
        details: `${item.Local || ''} | ${item.Escavadeira || ''}`,
        rawData: item,
      });
    });

    // Pedreira items
    pedreiraData?.forEach((item: Record<string, unknown>) => {
      items.push({
        id: String(item.ID || item.id || Math.random()),
        type: 'pedreira',
        date: String(item.Data || ''),
        time: String(item.Hora_Registro || item.Hora || ''),
        description: `${item.Caminhao || ''} - ${item.Material || ''}`,
        details: `Peso: ${item.Peso_Liquido || 0}kg`,
        rawData: item,
      });
    });

    // Pipa items
    pipaData?.forEach((item: Record<string, unknown>) => {
      items.push({
        id: String(item.ID || item.id || Math.random()),
        type: 'pipa',
        date: String(item.Data || ''),
        time: String(item.Hora_Chegada || ''),
        description: `Pipa ${item.Prefixo || ''}`,
        details: `${item.N_Viagens || 0} viagem(ns) | ${item.Capacidade || ''}`,
        rawData: item,
      });
    });

    // Cal items
    calData?.forEach((item: Record<string, unknown>) => {
      items.push({
        id: String(item.ID || item.id || Math.random()),
        type: 'cal',
        date: String(item.Data || ''),
        time: String(item.Hora || ''),
        description: `${item.Tipo || ''} - ${item.Quantidade || 0} ton`,
        details: `${item.Fornecedor || 'Sem fornecedor'}`,
        rawData: item,
      });
    });

    // Sort by date/time descending
    return items.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [cargaData, pedreiraData, pipaData, calData]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Tab filter
      if (activeTab !== 'todos' && item.type !== activeTab) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          item.description.toLowerCase().includes(search) ||
          item.details.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [allItems, activeTab, searchTerm]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, ApontamentoItem[]> = {};
    
    filteredItems.forEach(item => {
      const dateKey = item.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  }, [filteredItems]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      carga: 'bg-amber-100 text-amber-700',
      pedreira: 'bg-orange-100 text-orange-700',
      pipa: 'bg-blue-100 text-blue-700',
      cal: 'bg-emerald-100 text-emerald-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      carga: 'Carga',
      pedreira: 'Pedreira',
      pipa: 'Pipa',
      cal: 'Cal',
    };
    return labels[type] || type;
  };

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = parseDate(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isYesterday(date)) return 'Ontem';
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

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
            <h1 className="text-lg font-bold text-primary-foreground">Meus Apontamentos</h1>
            <p className="text-xs text-primary-foreground/70">
              {filteredItems.length} registro(s)
            </p>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="p-4 bg-white border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-10"
            placeholder="Buscar apontamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="carga" className="text-xs">Carga</TabsTrigger>
            <TabsTrigger value="pedreira" className="text-xs">Pedreira</TabsTrigger>
            <TabsTrigger value="pipa" className="text-xs">Pipa</TabsTrigger>
            <TabsTrigger value="cal" className="text-xs">Cal</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-8">
        {Object.entries(groupedItems).length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">Nenhum apontamento encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Tente outra busca' : 'Seus registros aparecerão aqui'}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([dateKey, items]) => (
            <div key={dateKey}>
              <h3 className="font-bold text-foreground mb-2 px-1 capitalize">
                {formatDateHeader(dateKey)}
              </h3>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("px-2 py-1 rounded-md text-xs font-medium", getTypeColor(item.type))}>
                          {getTypeLabel(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.details}</p>
                          {item.time && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{item.time}</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="shrink-0"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <EditApontamentoDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSave={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

// Helper function to parse date in various formats
function parseDate(dateStr: string): Date {
  // Try dd/MM/yyyy format
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
  }
  
  // Try yyyy-MM-dd format
  const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    return new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
  }
  
  return new Date(dateStr);
}
