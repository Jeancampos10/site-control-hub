import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Número da Sala Técnica (formato internacional sem +)
const SALA_TECNICA_WHATSAPP = "5521999999999"; // Substituir pelo número real

interface WhatsAppButtonProps {
  className?: string;
}

export function WhatsAppButton({ className }: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'resumo' | 'problema' | 'outro'>('resumo');
  const { profile } = useAuth();

  // Buscar dados para o resumo
  const { data: cargaData } = useGoogleSheets('carga');
  const { data: pedreiraData } = useGoogleSheets('apontamento_pedreira');
  const { data: pipaData } = useGoogleSheets('apontamento_pipa');
  const { data: calData } = useGoogleSheets('mov_cal');

  const todayCounts = {
    carga: filterByDate(cargaData, new Date()).length,
    pedreira: filterByDate(pedreiraData, new Date()).length,
    pipas: filterByDate(pipaData, new Date()).length,
    cal: filterByDate(calData, new Date()).length,
  };

  const generateSummary = () => {
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    const userName = profile ? `${profile.nome} ${profile.sobrenome}` : 'Apontador';
    
    return `📊 *RESUMO DIÁRIO - ${today}*

👷 Apontador: ${userName}

📋 *Registros do Dia:*
• Cargas: ${todayCounts.carga}
• Pedreira: ${todayCounts.pedreira}
• Pipas: ${todayCounts.pipas}
• CAL: ${todayCounts.cal}

📈 *Total:* ${todayCounts.carga + todayCounts.pedreira + todayCounts.pipas + todayCounts.cal} registros

---
_Enviado via ApropriAPP_`;
  };

  const handleSend = () => {
    let finalMessage = message;

    if (messageType === 'resumo') {
      finalMessage = generateSummary();
    } else if (messageType === 'problema' && profile) {
      const userName = `${profile.nome} ${profile.sobrenome}`;
      finalMessage = `⚠️ *PROBLEMA REPORTADO*

👷 Apontador: ${userName}
📅 Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}

📝 Descrição:
${message}

---
_Enviado via ApropriAPP_`;
    }

    if (!finalMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://wa.me/${SALA_TECNICA_WHATSAPP}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setMessage("");
    toast.success("Abrindo WhatsApp...");
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40",
          "bg-green-500 hover:bg-green-600",
          className
        )}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <Card className="w-full max-w-md animate-in slide-in-from-bottom duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Enviar para Sala Técnica
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMessageType('resumo')}
              className={cn(
                "p-2 rounded-lg border-2 text-center text-sm font-medium transition-all",
                messageType === 'resumo' 
                  ? "border-green-500 bg-green-50 text-green-700" 
                  : "border-slate-200 hover:border-green-300"
              )}
            >
              📊 Resumo
            </button>
            <button
              type="button"
              onClick={() => setMessageType('problema')}
              className={cn(
                "p-2 rounded-lg border-2 text-center text-sm font-medium transition-all",
                messageType === 'problema' 
                  ? "border-red-500 bg-red-50 text-red-700" 
                  : "border-slate-200 hover:border-red-300"
              )}
            >
              ⚠️ Problema
            </button>
            <button
              type="button"
              onClick={() => setMessageType('outro')}
              className={cn(
                "p-2 rounded-lg border-2 text-center text-sm font-medium transition-all",
                messageType === 'outro' 
                  ? "border-blue-500 bg-blue-50 text-blue-700" 
                  : "border-slate-200 hover:border-blue-300"
              )}
            >
              💬 Outro
            </button>
          </div>

          {/* Message Preview for Summary */}
          {messageType === 'resumo' && (
            <div className="bg-green-50 rounded-lg p-3 text-sm whitespace-pre-wrap">
              {generateSummary()}
            </div>
          )}

          {/* Message Input for Problem/Other */}
          {messageType !== 'resumo' && (
            <div className="space-y-2">
              <Label>
                {messageType === 'problema' ? 'Descreva o problema' : 'Sua mensagem'}
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  messageType === 'problema' 
                    ? "Ex: Escavadeira EX-01 apresentou problema no braço hidráulico..." 
                    : "Digite sua mensagem..."
                }
                rows={4}
              />
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSend} 
            className="w-full bg-green-500 hover:bg-green-600"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar via WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default WhatsAppButton;
