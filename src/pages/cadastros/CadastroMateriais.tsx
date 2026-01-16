import { useState } from "react";
import { Package, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Material {
  id: string;
  nome: string;
  unidade: string;
  ativo: boolean;
}

const mockData: Material[] = [
  { id: '1', nome: 'Argila', unidade: 'm³', ativo: true },
  { id: '2', nome: 'Brita', unidade: 'm³', ativo: true },
  { id: '3', nome: 'Areia', unidade: 'm³', ativo: true },
  { id: '4', nome: 'Pedra Rachão', unidade: 'ton', ativo: true },
];

export default function CadastroMateriais() {
  const [search, setSearch] = useState("");
  const [data] = useState<Material[]>(mockData);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredData = data.filter(item => 
    item.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    toast.success("Material salvo com sucesso!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Package className="h-6 w-6 text-warning" />
            Cadastro de Materiais
          </h1>
          <p className="page-subtitle">Tipos de materiais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Material</Label>
                <Input placeholder="Nome do material" />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input placeholder="Ex: m³, ton, kg" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch defaultChecked />
              </div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell>
                    <Badge variant={item.ativo ? 'default' : 'outline'} className={item.ativo ? 'bg-success' : ''}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
