import { Wrench } from "lucide-react";
import { GenericCadastroPage } from "@/components/cadastros/GenericCadastroPage";

export default function CadastroMecanicos() {
  return (
    <GenericCadastroPage
      title="Mecânicos"
      icon={<Wrench className="h-5 w-5 text-primary" />}
      tableName="cad_mecanicos"
      fields={[
        { key: "nome", label: "Nome", required: true },
        { key: "especialidade", label: "Especialidade", placeholder: "Ex: Motor, Hidráulica" },
        { key: "telefone", label: "Telefone" },
      ]}
    />
  );
}
