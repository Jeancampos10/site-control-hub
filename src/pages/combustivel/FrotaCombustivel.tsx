import { useMemo, useState } from "react";
import { Truck, RefreshCw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformVeiculosData, type VeiculoRecord } from "@/lib/abastech/sheetsDataTransform";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function FrotaCombustivel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");

  const { data: veiculosData, isLoading, refetch } = useGoogleSheets('Veiculos');

  const veiculos = useMemo<VeiculoRecord[]>(() => {
    if (!veiculosData) return [];
    return transformVeiculosData(veiculosData);
  }, [veiculosData]);

  // Filter veiculos
  const filteredVeiculos = useMemo(() => {
    return veiculos.filter(v => {
      const matchesSearch = 
        v.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.placa.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesCategoria = categoriaFilter === "all" || v.categoria === categoriaFilter;

      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [veiculos, searchTerm, statusFilter, categoriaFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = veiculos.length;
    const ativos = veiculos.filter(v => v.status === 'active').length;
    const manutencao = veiculos.filter(v => v.status === 'warning').length;
    const inativos = veiculos.filter(v => v.status === 'inactive').length;
    
    return { total, ativos, manutencao, inativos };
  }, [veiculos]);

  const getStatusBadge = (status: VeiculoRecord['status'], label: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      warning: 'secondary',
      inactive: 'destructive',
      pending: 'outline',
    };
    return <Badge variant={variants[status]}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-500" />
            Frota
          </h1>
          <p className="text-muted-foreground">
            Gestão de veículos e equipamentos
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-yellow-600">{stats.manutencao}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, tipo, marca, modelo ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="warning">Manutenção</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="Veiculo">Veículo</SelectItem>
                  <SelectItem value="Equipamento">Equipamento</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Veículos e Equipamentos
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredVeiculos.length} de {veiculos.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredVeiculos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {veiculos.length === 0 
                ? "Nenhum veículo encontrado. Verifique a conexão com a planilha."
                : "Nenhum veículo corresponde aos filtros selecionados."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Horímetro</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVeiculos.map((veiculo) => (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-medium">{veiculo.codigo}</TableCell>
                      <TableCell>{veiculo.tipo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{veiculo.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        {veiculo.marca} {veiculo.modelo}
                      </TableCell>
                      <TableCell>{veiculo.placa}</TableCell>
                      <TableCell>
                        {veiculo.horimetro > 0 ? `${veiculo.horimetro.toLocaleString('pt-BR')} h` : '-'}
                      </TableCell>
                      <TableCell>{veiculo.obra || '-'}</TableCell>
                      <TableCell>
                        {getStatusBadge(veiculo.status, veiculo.statusLabel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
