import { Fuel } from "lucide-react";
import { GenericCadastroPage, CadastroField } from "@/components/cadastros/GenericCadastroPage";

const fields: CadastroField[] = [
  { key: "nome", label: "Nome", required: true, placeholder: "Ex: Tanque 01" },
  { key: "tipo", label: "Tipo", placeholder: "Fixo / Móvel / Comboio" },
  { key: "capacidade", label: "Capacidade (L)", type: "number", placeholder: "10000" },
  { key: "local", label: "Localização", placeholder: "Ex: Pátio central" },
];

export default function CadastroTanques() {
  return (
    <GenericCadastroPage
      title="Tanques / Locais de Estoque"
      icon={<Fuel className="h-5 w-5 text-primary" />}
      tableName="cad_tanques"
      fields={fields}
      defaultValues={{ tipo: "Fixo" }}
    />
  );
}
