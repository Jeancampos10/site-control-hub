import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface MaterialOption {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
}

const MATERIAL_OPTIONS: MaterialOption[] = [
  { value: "argila", label: "Argila", color: "text-amber-700", bgColor: "bg-amber-100 hover:bg-amber-200 border-amber-300", icon: "🟤" },
  { value: "brita", label: "Brita", color: "text-slate-700", bgColor: "bg-slate-100 hover:bg-slate-200 border-slate-300", icon: "⬛" },
  { value: "areia", label: "Areia", color: "text-yellow-700", bgColor: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300", icon: "🟡" },
  { value: "rachao", label: "Rachão", color: "text-stone-700", bgColor: "bg-stone-100 hover:bg-stone-200 border-stone-300", icon: "🪨" },
  { value: "terra", label: "Terra", color: "text-orange-700", bgColor: "bg-orange-100 hover:bg-orange-200 border-orange-300", icon: "🟠" },
  { value: "saibro", label: "Saibro", color: "text-red-700", bgColor: "bg-red-100 hover:bg-red-200 border-red-300", icon: "🔴" },
  { value: "cascalho", label: "Cascalho", color: "text-gray-700", bgColor: "bg-gray-100 hover:bg-gray-200 border-gray-300", icon: "⚪" },
  { value: "po-de-pedra", label: "Pó de Pedra", color: "text-zinc-700", bgColor: "bg-zinc-100 hover:bg-zinc-200 border-zinc-300", icon: "🔘" },
];

interface MaterialCardsProps {
  value: string;
  onChange: (value: string) => void;
  customMaterials?: Array<{ Nome?: string; Material?: string }>;
}

export function MaterialCards({ value, onChange, customMaterials }: MaterialCardsProps) {
  // Usa materiais customizados se disponíveis, senão usa os padrões
  const materials = customMaterials && customMaterials.length > 0
    ? customMaterials.map((mat, index) => {
        const name = mat.Nome || mat.Material || `Material ${index + 1}`;
        const defaultOption = MATERIAL_OPTIONS[index % MATERIAL_OPTIONS.length];
        return {
          value: name.toLowerCase().replace(/\s+/g, '-'),
          label: name,
          color: defaultOption.color,
          bgColor: defaultOption.bgColor,
          icon: defaultOption.icon,
        };
      })
    : MATERIAL_OPTIONS;

  return (
    <div className="grid grid-cols-2 gap-2">
      {materials.map((material) => {
        const isSelected = value === material.value || value === material.label;
        
        return (
          <button
            key={material.value}
            type="button"
            onClick={() => onChange(material.label || material.value)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
              isSelected 
                ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-1" 
                : material.bgColor,
              "active:scale-95"
            )}
          >
            <span className="text-2xl">{material.icon}</span>
            <span className={cn(
              "font-semibold text-sm",
              isSelected ? "text-primary" : material.color
            )}>
              {material.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default MaterialCards;
