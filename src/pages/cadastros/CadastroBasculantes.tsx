import { useState } from "react";
import { Truck, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CadastroBasculantes() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useGoogleSheets('caminhao');

  const filteredData = data?.filter(item => 
    item.Prefixo_Cb?.toLowerCase().includes(search.toLowerCase()) ||
    item.Motorista?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSave = () => {
    toast.success("Caminhão salvo com sucesso!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Caminhões Basculantes
          </h1>
          <p className="page-subtitle">Cadastro de caminhões basculantes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Caminhão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Caminhão Basculante</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Prefixo</Label><Input placeholder="Ex: CB-001" /></div>
              <div className="space-y-2"><Label>Empresa</Label><Input placeholder="Empresa" /></div>
              <div className="space-y-2"><Label>Motorista</Label><Input placeholder="Nome do motorista" /></div>
              <div className="space-y-2"><Label>Marca</Label><Input placeholder="Marca" /></div>
              <div className="space-y-2"><Label>Potência</Label><Input placeholder="Ex: 400HP" /></div>
              <div className="space-y-2"><Label>Volume (m³)</Label><Input placeholder="Ex: 14" /></div>
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
                  <TableHead>Motorista</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.Prefixo_Cb}</TableCell>
                    <TableCell>{item.Empresa_Cb}</TableCell>
                    <TableCell>{item.Motorista}</TableCell>
                    <TableCell>{item.Volume} m³</TableCell>
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
