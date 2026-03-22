import { Building2 } from "lucide-react";
import { GenericCadastroPage, CadastroField } from "@/components/cadastros/GenericCadastroPage";

const fields: CadastroField[] = [
  { key: "nome", label: "Nome / Razão Social", required: true, placeholder: "Ex: Petrobras Distribuidora" },
  { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00" },
  { key: "contato", label: "Contato", placeholder: "Nome do contato" },
  { key: "telefone", label: "Telefone", placeholder: "(00) 00000-0000" },
  { key: "tipo", label: "Tipo", placeholder: "Combustível / Peças / Serviços" },
];

export default function CadastroFornecedoresGeral() {
  return (
    <GenericCadastroPage
      title="Fornecedores"
      icon={<Building2 className="h-5 w-5 text-primary" />}
      tableName="cad_fornecedores"
      fields={fields}
      defaultValues={{ tipo: "Combustível" }}
    />
  );
}
