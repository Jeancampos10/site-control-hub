import { Building2 } from "lucide-react";
import { GenericCadastroPage, CadastroField } from "@/components/cadastros/GenericCadastroPage";

const fields: CadastroField[] = [
  { key: "nome", label: "Nome da Obra", required: true, placeholder: "Ex: BR-040 Lote 3" },
  { key: "descricao", label: "Descrição", placeholder: "Detalhes da obra" },
  { key: "localizacao", label: "Localização", placeholder: "Cidade / UF" },
  { key: "responsavel", label: "Responsável", placeholder: "Nome do encarregado" },
];

export default function CadastroObras() {
  return (
    <GenericCadastroPage
      title="Obras"
      icon={<Building2 className="h-5 w-5 text-primary" />}
      tableName="cad_obras"
      fields={fields}
    />
  );
}
