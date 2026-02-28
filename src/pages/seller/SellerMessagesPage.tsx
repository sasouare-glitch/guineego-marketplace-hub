import { useState } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Clock,
  CheckCheck,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Mamadou Diallo",
    initials: "MD",
    lastMessage: "Bonjour, ma commande est arrivée ?",
    time: "Il y a 5 min",
    unread: 2,
    online: true,
    messages: [
      { id: "m1", text: "Bonjour, je voudrais savoir si le Bazin premium est disponible en bleu ?", time: "10:30", fromMe: false, read: true },
      { id: "m2", text: "Bonjour Mamadou ! Oui, nous avons le Bazin bleu en stock. Taille souhaitée ?", time: "10:35", fromMe: true, read: true },
      { id: "m3", text: "Super ! Je prends 3 mètres s'il vous plaît.", time: "10:40", fromMe: false, read: true },
      { id: "m4", text: "Parfait, je prépare votre commande. Paiement par Orange Money ?", time: "10:42", fromMe: true, read: true },
      { id: "m5", text: "Oui Orange Money. Merci beaucoup !", time: "10:45", fromMe: false, read: true },
      { id: "m6", text: "Commande préparée et expédiée ! Numéro de suivi: CMD-2847", time: "11:00", fromMe: true, read: true },
      { id: "m7", text: "Bonjour, ma commande est arrivée ?", time: "14:20", fromMe: false, read: false },
    ],
  },
  {
    id: "2",
    name: "Aissatou Barry",
    initials: "AB",
    lastMessage: "Merci pour la livraison rapide !",
    time: "Il y a 1h",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "Bonjour, avez-vous reçu mon paiement ?", time: "09:00", fromMe: false, read: true },
      { id: "m2", text: "Oui, paiement bien reçu ! Votre commande sera livrée demain.", time: "09:15", fromMe: true, read: true },
      { id: "m3", text: "Merci pour la livraison rapide !", time: "13:30", fromMe: false, read: true },
    ],
  },
  {
    id: "3",
    name: "Fatou Camara",
    initials: "FC",
    lastMessage: "Est-ce que vous faites des réductions ?",
    time: "Il y a 3h",
    unread: 1,
    online: true,
    messages: [
      { id: "m1", text: "Bonjour ! Vos produits sont magnifiques.", time: "08:00", fromMe: false, read: true },
      { id: "m2", text: "Merci beaucoup Fatou ! 😊", time: "08:30", fromMe: true, read: true },
      { id: "m3", text: "Est-ce que vous faites des réductions ?", time: "11:15", fromMe: false, read: false },
    ],
  },
  {
    id: "4",
    name: "Ibrahima Sow",
    initials: "IS",
    lastMessage: "Je confirme la commande",
    time: "Hier",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "Bonjour, combien coûte l'ensemble complet ?", time: "Hier 16:00", fromMe: false, read: true },
      { id: "m2", text: "L'ensemble est à 350 000 GNF. Livraison offerte à Conakry !", time: "Hier 16:20", fromMe: true, read: true },
      { id: "m3", text: "Je confirme la commande", time: "Hier 17:00", fromMe: false, read: true },
    ],
  },
  {
    id: "5",
    name: "Kadiatou Bah",
    initials: "KB",
    lastMessage: "D'accord, je passe demain",
    time: "Il y a 2 jours",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", text: "Vous avez un point de vente physique ?", time: "Il y a 2 jours", fromMe: false, read: true },
      { id: "m2", text: "Oui, nous sommes au marché de Madina, stand 45.", time: "Il y a 2 jours", fromMe: true, read: true },
      { id: "m3", text: "D'accord, je passe demain", time: "Il y a 2 jours", fromMe: false, read: true },
    ],
  },
];

const SellerMessagesPage = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedId, setSelectedId] = useState<string | null>(mockConversations[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const selected = conversations.find((c) => c.id === selectedId);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!newMessage.trim() || !selectedId) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: newMessage,
              time: "À l'instant",
              messages: [
                ...c.messages,
                { id: `m-${Date.now()}`, text: newMessage, time: timeStr, fromMe: true, read: false },
              ],
            }
          : c
      )
    );
    setNewMessage("");
  };

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    // Mark messages as read
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );
  };

  return (
    <SellerLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">
              {totalUnread > 0
                ? `${totalUnread} message${totalUnread > 1 ? "s" : ""} non lu${totalUnread > 1 ? "s" : ""}`
                : "Tous les messages sont lus"}
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="flex h-[calc(100vh-14rem)] min-h-[500px]">
            {/* Conversations list */}
            <div
              className={cn(
                "w-full sm:w-80 lg:w-96 border-r border-border flex flex-col flex-shrink-0",
                selectedId && "hidden sm:flex"
              )}
            >
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un client..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* List */}
              <ScrollArea className="flex-1">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune conversation trouvée</p>
                  </div>
                ) : (
                  filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50",
                        selectedId === conv.id && "bg-muted"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {conv.initials}
                          </AvatarFallback>
                        </Avatar>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-sm font-medium text-foreground truncate", conv.unread > 0 && "font-semibold")}>
                            {conv.name}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{conv.time}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                          {conv.unread > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1.5 flex-shrink-0">
                              {conv.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat area */}
            {selected ? (
              <div className={cn("flex-1 flex flex-col", !selectedId && "hidden sm:flex")}>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8 w-8"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {selected.initials}
                      </AvatarFallback>
                    </Avatar>
                    {selected.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.online ? "En ligne" : "Hors ligne"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {selected.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex", msg.fromMe ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.fromMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          )}
                        >
                          <p>{msg.text}</p>
                          <div className={cn("flex items-center gap-1 mt-1", msg.fromMe ? "justify-end" : "justify-start")}>
                            <Clock className="h-3 w-3 opacity-60" />
                            <span className="text-[10px] opacity-60">{msg.time}</span>
                            {msg.fromMe && (
                              <CheckCheck className={cn("h-3 w-3", msg.read ? "opacity-90" : "opacity-40")} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border bg-card">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Input
                      placeholder="Écrire un message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 hidden sm:flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </SellerLayout>
  );
};

export default SellerMessagesPage;
