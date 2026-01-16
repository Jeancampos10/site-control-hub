import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  Send, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Wifi,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useOfflineSync, PendingItem } from "@/hooks/useOfflineSync";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PendenciasOffline() {
  const navigate = useNavigate();
  const { 
    pendingItems, 
    syncItem, 
    syncAll, 
    removeItem, 
    clearAll, 
    isOnline,
    isSyncing 
  } = useOfflineSync();
  
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncItem = async (item: PendingItem) => {
    setSyncingId(item.id);
    try {
      await syncItem(item.id);
      toast.success("Item sincronizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao sincronizar item");
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAll();
      toast.success("Todos os itens sincronizados!");
    } catch (error) {
      toast.error("Erro ao sincronizar alguns itens");
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast.success("Item removido");
  };

  const handleClearAll = () => {
    clearAll();
    toast.success("Todas as pendências foram removidas");
  };

  const getTypeLabel = (type: PendingItem['type']) => {
    const labels: Record<PendingItem['type'], string> = {
      carga: 'Carga',
      descarga: 'Lançamento',
      apontamento_pedreira: 'Pedreira',
      apontamento_pipa: 'Pipas',
      mov_cal: 'Cal',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: PendingItem['type']) => {
    const colors: Record<PendingItem['type'], string> = {
      carga: 'bg-amber-100 text-amber-700',
      descarga: 'bg-emerald-100 text-emerald-700',
      apontamento_pedreira: 'bg-orange-100 text-orange-700',
      apontamento_pipa: 'bg-blue-100 text-blue-700',
      mov_cal: 'bg-purple-100 text-purple-700',
    };
    return colors[type];
  };

  const getStatusBadge = (status: PendingItem['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case 'syncing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Sincronizando</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'synced':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Sincronizado</Badge>;
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
            <h1 className="text-lg font-bold text-primary-foreground">Pendências Offline</h1>
            <p className="text-xs text-primary-foreground/70">
              {pendingItems.length} item(ns) pendente(s)
            </p>
          </div>
          {isOnline ? (
            <div className="flex items-center gap-1 text-green-300">
              <Wifi className="h-4 w-4" />
              <span className="text-xs">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-300">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs">Offline</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 pb-32">
        {/* Status Card */}
        <Card className={cn(
          "border-0 shadow-md",
          isOnline ? "bg-gradient-to-r from-green-50 to-emerald-50" : "bg-gradient-to-r from-red-50 to-orange-50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <>
                  <div className="p-2 rounded-full bg-green-100">
                    <Wifi className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">Conexão Ativa</p>
                    <p className="text-xs text-green-600">Pronto para sincronizar</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-full bg-red-100">
                    <WifiOff className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">Sem Conexão</p>
                    <p className="text-xs text-red-600">Os dados serão salvos localmente</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {pendingItems.length > 0 && (
          <div className="flex gap-2">
            <Button 
              className="flex-1 h-12"
              onClick={handleSyncAll}
              disabled={!isOnline || isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar Tudo
                </>
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-12" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar Pendências?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso removerá todos os {pendingItems.length} itens pendentes. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive">
                    Limpar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Pending Items List */}
        {pendingItems.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="font-semibold text-lg">Tudo Sincronizado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Não há pendências para enviar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="font-bold text-foreground px-1">Itens Pendentes</h3>
            
            {pendingItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("px-2 py-1 rounded-md text-xs font-medium", getTypeColor(item.type))}>
                        {getTypeLabel(item.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {String(item.data.Caminhao || item.data.Prefixo || item.data.Material || 'Registro')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    {item.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-700">{item.error}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex border-t">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-slate-50 transition-colors disabled:opacity-50"
                      onClick={() => handleSyncItem(item)}
                      disabled={!isOnline || syncingId === item.id}
                    >
                      {syncingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Enviar
                    </button>
                    <div className="w-px bg-slate-200" />
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-destructive hover:bg-red-50 transition-colors"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800 text-sm">Como funciona?</p>
                <p className="text-xs text-blue-600 mt-1">
                  Quando você está sem internet, seus apontamentos são salvos localmente. 
                  Quando a conexão voltar, você pode sincronizar todos de uma vez ou individualmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
