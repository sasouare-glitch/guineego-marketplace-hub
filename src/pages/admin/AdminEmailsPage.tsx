/**
 * ADMIN EMAILS: Dashboard for monitoring sent emails
 * Reads from Firestore 'mail' collection (Trigger Email extension) 
 * and 'email_logs' collection (SendGrid fallback logs)
 */

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Send,
  AlertTriangle,
  BarChart3,
  Inbox,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "@/hooks/use-toast";

interface MailDoc {
  id: string;
  to: string;
  message?: {
    subject?: string;
    html?: string;
  };
  delivery?: {
    state?: string;
    startTime?: Timestamp;
    endTime?: Timestamp;
    error?: string;
    attempts?: number;
    leaseExpireTime?: Timestamp;
    info?: {
      messageId?: string;
      accepted?: string[];
      rejected?: string[];
      response?: string;
    };
  };
  createdAt?: Timestamp;
  _resendOf?: string;
  _resendCount?: number;
}

type DeliveryState = "all" | "SUCCESS" | "PENDING" | "ERROR" | "PROCESSING";

const stateConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  SUCCESS: { label: "Envoyé", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  PENDING: { label: "En attente", color: "bg-amber-500/10 text-amber-600 border-amber-200", icon: Clock },
  PROCESSING: { label: "En cours", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: RefreshCw },
  ERROR: { label: "Erreur", color: "bg-red-500/10 text-red-600 border-red-200", icon: XCircle },
  UNKNOWN: { label: "Inconnu", color: "bg-muted text-muted-foreground border-border", icon: AlertTriangle },
};

function getState(doc: MailDoc): string {
  return doc.delivery?.state || "PENDING";
}

function formatDate(ts?: Timestamp): string {
  if (!ts) return "—";
  const d = ts.toDate();
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<MailDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryState>("all");
  const [selectedEmail, setSelectedEmail] = useState<MailDoc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [maxResults, setMaxResults] = useState(100);
  const [resending, setResending] = useState<string | null>(null);

  const MAX_RESENDS = 3;

  // Count resends for a given original email (by tracing _resendOf chain)
  const getResendCount = (email: MailDoc): number => {
    // If this email itself has a _resendCount, use it
    if (typeof email._resendCount === "number") return email._resendCount;
    // Count how many emails in the list reference this one (or its origin)
    const originId = email._resendOf || email.id;
    return emails.filter((e) => e._resendOf === originId || e._resendOf === email.id).length;
  };

  const canResend = (email: MailDoc): boolean => {
    const state = getState(email);
    if (state !== "ERROR" && state !== "PENDING") return false;
    return getResendCount(email) < MAX_RESENDS;
  };

  // Resend an email by creating a new document in the 'mail' collection
  const handleResend = async (email: MailDoc) => {
    if (!email.to || !email.message?.subject || !email.message?.html) {
      toast({ title: "Impossible de renvoyer", description: "Données de l'email incomplètes.", variant: "destructive" });
      return;
    }
    const count = getResendCount(email);
    if (count >= MAX_RESENDS) {
      toast({ title: "Limite atteinte", description: `Cet email a déjà été renvoyé ${MAX_RESENDS} fois.`, variant: "destructive" });
      return;
    }
    setResending(email.id);
    try {
      const originId = email._resendOf || email.id;
      await addDoc(collection(db, "mail"), {
        to: email.to,
        message: {
          subject: email.message.subject,
          html: email.message.html,
        },
        createdAt: serverTimestamp(),
        _resendOf: originId,
        _resendCount: count + 1,
      });
      toast({ title: "✅ Email renvoyé", description: `Renvoi ${count + 1}/${MAX_RESENDS} pour ${email.to}` });
    } catch (error: any) {
      console.error("Erreur renvoi email:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de renvoyer l'email.", variant: "destructive" });
    } finally {
      setResending(null);
    }
  };

  // Real-time listener on 'mail' collection
  useEffect(() => {
    setLoading(true);
    const mailRef = collection(db, "mail");
    const q = query(mailRef, orderBy("createdAt", "desc"), limit(maxResults));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: MailDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MailDoc[];
        setEmails(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lecture collection mail:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [maxResults]);

  // Filtered emails
  const filtered = emails.filter((email) => {
    const matchSearch =
      !searchQuery ||
      email.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.message?.subject?.toLowerCase().includes(searchQuery.toLowerCase());

    const state = getState(email);
    const matchStatus = statusFilter === "all" || state === statusFilter;

    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: emails.length,
    success: emails.filter((e) => getState(e) === "SUCCESS").length,
    pending: emails.filter((e) => getState(e) === "PENDING").length,
    error: emails.filter((e) => getState(e) === "ERROR").length,
  };

  return (
    <AdminLayout title="Emails" description="Suivi des emails envoyés">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.success}</p>
                  <p className="text-xs text-muted-foreground">Envoyés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.error}</p>
                  <p className="text-xs text-muted-foreground">Erreurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par email ou sujet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as DeliveryState)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="SUCCESS">✅ Envoyé</SelectItem>
                  <SelectItem value="PENDING">⏳ En attente</SelectItem>
                  <SelectItem value="PROCESSING">🔄 En cours</SelectItem>
                  <SelectItem value="ERROR">❌ Erreur</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(maxResults)}
                onValueChange={(v) => setMaxResults(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 derniers</SelectItem>
                  <SelectItem value="100">100 derniers</SelectItem>
                  <SelectItem value="200">200 derniers</SelectItem>
                  <SelectItem value="500">500 derniers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Emails Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Inbox className="w-5 h-5" />
              Emails ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Chargement...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">Aucun email trouvé</p>
                <p className="text-sm">
                  {searchQuery || statusFilter !== "all"
                    ? "Essayez de modifier vos filtres"
                    : "La collection 'mail' est vide dans Firestore"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead className="hidden md:table-cell">Sujet</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="hidden lg:table-cell">Tentatives</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((email) => {
                      const state = getState(email);
                      const cfg = stateConfig[state] || stateConfig.UNKNOWN;
                      const Icon = cfg.icon;

                      return (
                        <TableRow key={email.id} className="group">
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`gap-1.5 ${cfg.color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {email.to || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground">
                            {email.message?.subject || "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(email.createdAt || email.delivery?.startTime)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center">
                            {email.delivery?.attempts || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(state === "ERROR" || state === "PENDING") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResend(email)}
                                  disabled={resending === email.id || !canResend(email)}
                                  className="text-primary"
                                  title={
                                    !canResend(email)
                                      ? `Limite de ${MAX_RESENDS} renvois atteinte`
                                      : `Renvoyer (${getResendCount(email)}/${MAX_RESENDS})`
                                  }
                                >
                                  {resending === email.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                  <span className="hidden sm:inline ml-1">
                                    {getResendCount(email)}/{MAX_RESENDS}
                                  </span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmail(email);
                                  setPreviewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Détails</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Detail Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Détails de l'email
              </DialogTitle>
            </DialogHeader>

            {selectedEmail && (
              <div className="space-y-4">
                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Destinataire</p>
                    <p className="text-sm font-medium text-foreground">{selectedEmail.to}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Statut</p>
                    {(() => {
                      const state = getState(selectedEmail);
                      const cfg = stateConfig[state] || stateConfig.UNKNOWN;
                      const Icon = cfg.icon;
                      return (
                        <Badge variant="outline" className={`gap-1.5 ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Date d'envoi</p>
                    <p className="text-sm text-foreground">
                      {formatDate(selectedEmail.createdAt || selectedEmail.delivery?.startTime)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Tentatives</p>
                    <p className="text-sm text-foreground">{selectedEmail.delivery?.attempts || 0}</p>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Sujet</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedEmail.message?.subject || "—"}
                  </p>
                </div>

                {/* Error info */}
                {selectedEmail.delivery?.error && (
                  <div className="bg-red-500/5 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-600 mb-1">Message d'erreur</p>
                    <p className="text-sm text-red-700 font-mono">
                      {selectedEmail.delivery.error}
                    </p>
                  </div>
                )}

                {/* SMTP Response */}
                {selectedEmail.delivery?.info?.response && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Réponse SMTP</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground">
                      {selectedEmail.delivery.info.response}
                    </p>
                  </div>
                )}

                {/* HTML Preview */}
                {selectedEmail.message?.html && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Aperçu du contenu</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={selectedEmail.message.html}
                        className="w-full h-[400px] bg-white"
                        title="Aperçu email"
                        sandbox=""
                      />
                    </div>
                  </div>
                )}

                {/* Resend + Document ID */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    ID: <span className="font-mono">{selectedEmail.id}</span>
                  </p>
                  {(getState(selectedEmail) === "ERROR" || getState(selectedEmail) === "PENDING") && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getResendCount(selectedEmail)}/{MAX_RESENDS} renvois
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleResend(selectedEmail);
                          setPreviewOpen(false);
                        }}
                        disabled={resending === selectedEmail.id || !canResend(selectedEmail)}
                        className="gap-2"
                      >
                        {resending === selectedEmail.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {canResend(selectedEmail) ? "Renvoyer" : "Limite atteinte"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
