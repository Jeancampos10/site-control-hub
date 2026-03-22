import { Droplet } from "lucide-react";
import { GenericCadastroPage } from "@/components/cadastros/GenericCadastroPage";

export default function CadastroTiposOleo() {
  return (
    <GenericCadastroPage
      title="Tipos de Óleo"
      icon={<Droplet className="h-5 w-5 text-amber-500" />}
      tableName="cad_tipos_oleo"
      fields={[
        { key: "nome", label: "Nome", required: true },
        { key: "viscosidade", label: "Viscosidade", placeholder: "Ex: 15W40" },
        { key: "aplicacao", label: "Aplicação", placeholder: "Ex: Motor, Hidráulico" },
      ]}
    />
  );
}
