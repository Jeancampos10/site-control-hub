import { Droplet } from "lucide-react";
import { GenericCadastroPage } from "@/components/cadastros/GenericCadastroPage";

export default function CadastroLubrificantes() {
  return (
    <GenericCadastroPage
      title="Lubrificantes"
      icon={<Droplet className="h-5 w-5 text-primary" />}
      tableName="cad_lubrificantes"
      fields={[
        { key: "nome", label: "Nome", required: true },
        { key: "tipo", label: "Tipo", placeholder: "Ex: Graxa, Fluido" },
        { key: "marca", label: "Marca" },
        { key: "unidade", label: "Unidade", placeholder: "Litro" },
      ]}
      defaultValues={{ unidade: "Litro" }}
    />
  );
}
