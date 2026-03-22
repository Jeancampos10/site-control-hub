import { Package } from "lucide-react";
import { GenericCadastroPage } from "@/components/cadastros/GenericCadastroPage";

export default function CadastroPecas() {
  return (
    <GenericCadastroPage
      title="Peças"
      icon={<Package className="h-5 w-5 text-primary" />}
      tableName="cad_pecas"
      fields={[
        { key: "nome", label: "Nome", required: true },
        { key: "codigo", label: "Código" },
        { key: "categoria", label: "Categoria", placeholder: "Ex: Filtros, Correias" },
        { key: "unidade", label: "Unidade", placeholder: "Un" },
        { key: "estoque_minimo", label: "Estoque Mínimo", type: "number" },
      ]}
      defaultValues={{ unidade: "Un", estoque_minimo: 0 }}
    />
  );
}
