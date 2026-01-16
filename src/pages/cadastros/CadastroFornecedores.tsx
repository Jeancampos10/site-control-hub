import { useState } from "react";
import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  contato: string;
  ativo: boolean;
}

const mockData: Fornecedor[] = [
  { id: '1', nome: 'CAL Norte Ltda', cnpj: '12.345.678/0001-90', contato: '(11) 99999-0000', ativo: true },
  { id: '2', nome: 'Mineradora Sul', cnpj: '98.765.432/0001-10', contato: '(21) 88888-1111', ativo: true },
];

export default function CadastroFornecedores() {
  const [search, setSearch] = useState("");
  const [data] = useState<Fornecedor[]>(mockData);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredData = data.filter(item => 
    item.nome.toLowerCase().includes(search.toLowerCase()) ||
    item.cnpj.includes(search)
  );

  const handleSave = () => {
    toast.success("Fornecedor salvo com sucesso!");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="h-6 w-6 text-info" />
            Fornecedores de CAL
          </h1>
          <p className="page-subtitle">Cadastro de fornecedores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Nome do fornecedor" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input placeholder="Telefone ou email" />
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="font-mono text-sm">{item.cnpj}</TableCell>
                  <TableCell>{item.contato}</TableCell>
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
