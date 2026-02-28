import { useState } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card } from "@/components/ui/card";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSellerMessages } from "@/hooks/useSellerMessages";
import { Timestamp } from "firebase/firestore";

// ============================================
// HELPERS
// ============================================

function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const date = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR");
}

function formatMessageTime(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  const date = ts.toDate();
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

// ============================================
// COMPONENT
// ============================================

const SellerMessagesPage = () => {
  const {
    conversations,
    messages,
    selectedConversation,
    selectedConversationId,
    loading,
    messagesLoading,
    totalUnread,
    selectConversation,
    sendMessage,
    setSelectedConversationId,
  } = useSellerMessages();

  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const filtered = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage("");
    await sendMessage(text);
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
                selectedConversationId && "hidden sm:flex"
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
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Aucune conversation trouvée" : "Aucune conversation pour le moment"}
                    </p>
                  </div>
                ) : (
                  filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50",
                        selectedConversationId === conv.id && "bg-muted"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {conv.customerInitials}
                          </AvatarFallback>
                        </Avatar>
                        {conv.customerOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-sm font-medium text-foreground truncate", conv.unreadBySeller > 0 && "font-semibold")}>
                            {conv.customerName}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatTimestamp(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                          {conv.unreadBySeller > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1.5 flex-shrink-0">
                              {conv.unreadBySeller}
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
            {selectedConversation ? (
              <div className={cn("flex-1 flex flex-col", !selectedConversationId && "hidden sm:flex")}>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8 w-8"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {selectedConversation.customerInitials}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.customerOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{selectedConversation.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.customerOnline ? "En ligne" : "Hors ligne"}
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
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Démarrez la conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const fromMe = msg.senderRole === "seller";
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", fromMe ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                                fromMe
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              )}
                            >
                              <p>{msg.text}</p>
                              <div className={cn("flex items-center gap-1 mt-1", fromMe ? "justify-end" : "justify-start")}>
                                <Clock className="h-3 w-3 opacity-60" />
                                <span className="text-[10px] opacity-60">{formatMessageTime(msg.createdAt)}</span>
                                {fromMe && (
                                  <CheckCheck className={cn("h-3 w-3", msg.read ? "opacity-90" : "opacity-40")} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
