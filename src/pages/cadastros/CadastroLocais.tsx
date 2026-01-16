import { useState } from "react";
import { MapPin, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Local {
  id: string;
  tipo: 'Origem' | 'Destino';
  nome: string;
  obra: string;
  ativo: boolean;
}

const mockData: Local[] = [
  { id: '1', tipo: 'Origem', nome: 'Jazida Norte', obra: 'BR-101', ativo: true },
  { id: '2', tipo: 'Destino', nome: 'Aterro Sul', obra: 'BR-101', ativo: true },
  { id: '3', tipo: 'Origem', nome: 'Corte KM 45', obra: 'BR-101', ativo: true },
];

export default function CadastroLocais() {
  const [search, setSearch] = useState("");
  const [data] = useState<Local[]>(mockData);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredData = data.filter(item => 
    item.nome.toLowerCase().includes(search.toLowerCase()) ||
    item.obra.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    toast.success("Local salvo com sucesso!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <MapPin className="h-6 w-6 text-accent" />
            Cadastro de Locais
          </h1>
          <p className="page-subtitle">Locais de origem e destino</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Local
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Local</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Origem">Origem</SelectItem>
                    <SelectItem value="Destino">Destino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome do Local</Label>
                <Input placeholder="Nome do local" />
              </div>
              <div className="space-y-2">
                <Label>Obra</Label>
                <Input placeholder="Nome da obra" />
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
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={item.tipo === 'Origem' ? 'default' : 'secondary'}>
                      {item.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.obra}</TableCell>
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
