import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ShoppingCart,
  MapPin,
  CreditCard,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  actions?: { label: string; value: string }[];
}

interface ProductChatAgentProps {
  productName: string;
  productPrice: number;
  productImage: string;
  sellerName: string;
}

const MOCK_RESPONSES: Record<string, string> = {
  default: "Bonjour ! 👋 Je suis l'assistant GuineeGo. Je peux vous aider avec les détails de ce produit, discuter du prix, ou passer commande directement. Que souhaitez-vous savoir ?",
  prix: "Le prix affiché est de **2 500 000 GNF**. Je peux vous proposer une réduction de **5%** si vous commandez maintenant, soit **2 375 000 GNF**. Ça vous intéresse ? 🎉",
  details: "Voici les caractéristiques principales :\n\n📱 **Écran** : 6.7\" AMOLED 120Hz\n⚡ **Processeur** : Snapdragon 8 Gen 2\n📸 **Caméra** : 200MP principale\n🔋 **Batterie** : 5000mAh\n\nVoulez-vous en savoir plus ou passer commande ?",
  commande: "Parfait ! Pour finaliser votre commande, j'ai besoin de quelques informations :\n\n1️⃣ **Votre nom complet**\n2️⃣ **Numéro de téléphone**\n3️⃣ **Adresse de livraison**\n\nCommençons par votre nom ?",
  paiement: "Nous acceptons les modes de paiement suivants :\n\n💰 **Orange Money**\n💰 **MTN Mobile Money**\n💳 **Carte bancaire**\n🏦 **Paiement à la livraison**\n\nLequel préférez-vous ?",
};

const QUICK_ACTIONS = [
  { label: "📋 Détails produit", value: "Montre-moi les détails du produit" },
  { label: "💰 Négocier le prix", value: "Je voudrais négocier le prix" },
  { label: "🛒 Commander", value: "Je veux passer commande" },
  { label: "💳 Modes de paiement", value: "Quels sont les modes de paiement ?" },
];

export function ProductChatAgent({
  productName,
  productPrice,
  productImage,
  sellerName,
}: ProductChatAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Bonjour ! 👋 Je suis l'assistant IA de **${sellerName}**. Je peux vous renseigner sur le **${productName}**, négocier le prix, ou vous aider à passer commande. Comment puis-je vous aider ?`,
          timestamp: new Date(),
          actions: QUICK_ACTIONS.map((a) => ({ label: a.label, value: a.value })),
        },
      ]);
    }
  }, [isOpen, messages.length, productName, sellerName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    const lower = userMessage.toLowerCase();
    let responseKey = "default";
    if (lower.includes("prix") || lower.includes("négocier") || lower.includes("reduction") || lower.includes("cher")) {
      responseKey = "prix";
    } else if (lower.includes("détail") || lower.includes("caractéristique") || lower.includes("spec") || lower.includes("info")) {
      responseKey = "details";
    } else if (lower.includes("command") || lower.includes("acheter") || lower.includes("achat")) {
      responseKey = "commande";
    } else if (lower.includes("paiement") || lower.includes("payer") || lower.includes("orange") || lower.includes("mtn")) {
      responseKey = "paiement";
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: MOCK_RESPONSES[responseKey],
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    simulateResponse(userMsg.content);
  };

  const handleQuickAction = (value: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: value,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    simulateResponse(value);
  };

  const formatPrice = (price: number) => price.toLocaleString("fr-GN") + " GNF";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
      >
        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
        <span className="font-semibold text-sm">Assistant IA</span>
        <Badge className="bg-guinea-red text-white text-[10px] px-1.5 py-0 ml-1">
          Nouveau
        </Badge>
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] flex flex-col shadow-2xl border-border/50 rounded-2xl overflow-hidden bg-card">
      {/* Header */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-semibold text-sm">
              Assistant IA
            </h3>
            <p className="text-primary-foreground/70 text-xs">
              {sellerName} • En ligne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsOpen(false)}
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Product Context Bar */}
      <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
        <img
          src={productImage}
          alt={productName}
          className="w-10 h-10 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{productName}</p>
          <p className="text-xs font-bold text-guinea-green">
            {formatPrice(productPrice)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                {msg.content.split("\n").map((line, i) => {
                  const bold = line.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong>$1</strong>'
                  );
                  return (
                    <p
                      key={i}
                      className={cn(i > 0 && "mt-1")}
                      dangerouslySetInnerHTML={{ __html: bold }}
                    />
                  );
                })}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                {msg.actions.map((action) => (
                  <button
                    key={action.value}
                    onClick={() => handleQuickAction(action.value)}
                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-medium"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Indicators */}
      <div className="px-4 py-1.5 border-t border-border bg-muted/30 flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <ShoppingCart className="w-3 h-3" /> Commande
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Livraison
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="w-3 h-3" /> Paiement
        </span>
        <span className="ml-auto text-primary font-medium">Propulsé par IA</span>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question..."
            className="rounded-full text-sm h-10"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
