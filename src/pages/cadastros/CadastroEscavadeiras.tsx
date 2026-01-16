import { useState } from "react";
import { Shovel, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CadastroEscavadeiras() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useGoogleSheets('equipamentos');

  const filteredData = data?.filter(item => 
    item.Prefixo_Eq?.toLowerCase().includes(search.toLowerCase()) ||
    item.Operador?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSave = () => {
    toast.success("Escavadeira salva com sucesso!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Shovel className="h-6 w-6 text-success" />
            Cadastro de Escavadeiras
          </h1>
          <p className="page-subtitle">Equipamentos de carga</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Escavadeira</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Escavadeira</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Prefixo</Label><Input placeholder="Ex: EX-001" /></div>
              <div className="space-y-2"><Label>Empresa</Label><Input placeholder="Empresa" /></div>
              <div className="space-y-2"><Label>Operador</Label><Input placeholder="Nome do operador" /></div>
              <div className="space-y-2"><Label>Marca</Label><Input placeholder="Marca do equipamento" /></div>
              <div className="space-y-2"><Label>Potência</Label><Input placeholder="Ex: 320HP" /></div>
              <div className="space-y-2"><Label>Encarregado</Label><Input placeholder="Encarregado responsável" /></div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Potência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.Prefixo_Eq}</TableCell>
                    <TableCell>{item.Empresa_Eq}</TableCell>
                    <TableCell>{item.Operador}</TableCell>
                    <TableCell>{item.Marca}</TableCell>
                    <TableCell>{item.Potencia}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
