/**
 * ADMIN PAGE: Lessor Requests Management
 * Review uploaded documents, approve/reject with comments + audit trail
 */
import { useEffect, useMemo, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, getDoc, setDoc, serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  CalendarDays, Check, X, Clock, FileText, ExternalLink, Eye,
  AlertCircle, MapPin, Phone, Mail, Building2, History, Loader2,
} from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface UploadedDoc { url: string; path: string }
interface ReviewEntry {
  action: "approved" | "rejected" | "info_requested" | "revoked";
  by: string;
  byName: string | null;
  at: any;
  comment: string;
}
interface LessorRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: "pending" | "approved" | "rejected" | "info_requested" | "revoked";
  motivation?: string | null;
  applicationData?: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    businessName?: string | null;
    equipmentTypes: string;
  };
  documents?: Partial<Record<"idDocument" | "proofOfAddress" | "businessRegistry" | "insurance", UploadedDoc>>;
  currentRoles?: string[];
  adminNote?: string;
  reviewHistory?: ReviewEntry[];
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
}

const DOC_LABELS: Record<string, string> = {
  idDocument: "Pièce d'identité",
  proofOfAddress: "Justificatif de domicile",
  businessRegistry: "Registre de commerce",
  insurance: "Attestation d'assurance",
};

const fmtDate = (ts: any) => {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export default function AdminLessorRequestsPage() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<LessorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LessorRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "role_requests"),
      where("requestedRole", "==", "lessor"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q,
      (snap) => {
        setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LessorRequest)));
        setLoading(false);
      },
      (err) => {
        console.error("lessor requests", err);
        setLoading(false);
      });
    return unsub;
  }, []);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const processed = useMemo(() => requests.filter((r) => r.status !== "pending"), [requests]);
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const openAction = (req: LessorRequest, a: "approve" | "reject") => {
    setSelected(req);
    setAction(a);
    setComment("");
  };

  const handleSubmit = async () => {
    if (!selected || !action || !user) return;
    if (action === "reject" && comment.trim().length < 5) {
      toast.error("Merci de préciser le motif du refus.");
      return;
    }
    setProcessing(true);
    try {
      const reviewer: ReviewEntry = {
        action: action === "approve" ? "approved" : "rejected",
        by: user.uid,
        byName: profile?.displayName || user.email || "Admin",
        at: new Date(),
        comment: comment.trim() || (action === "approve" ? "Demande approuvée" : "Demande refusée"),
      };

      // Update request
      await updateDoc(doc(db, "role_requests", selected.id), {
        status: action === "approve" ? "approved" : "rejected",
        adminNote: comment.trim() || null,
        reviewedBy: user.uid,
        reviewedByName: reviewer.byName,
        reviewedAt: serverTimestamp(),
        reviewHistory: arrayUnion(reviewer),
        updatedAt: serverTimestamp(),
      });

      // Approve → grant lessor role + provision lessor profile
      if (action === "approve") {
        const userRef = doc(db, "users", selected.userId);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data() || {};
        const existing: string[] = data.roles || [data.role || "customer"];
        if (!existing.includes("lessor")) {
          await updateDoc(userRef, {
            roles: [...existing, "lessor"],
            updatedAt: serverTimestamp(),
          });
        }
        const lessorRef = doc(db, "lessors", selected.userId);
        const lessorSnap = await getDoc(lessorRef);
        if (!lessorSnap.exists()) {
          await setDoc(lessorRef, {
            ownerId: selected.userId,
            displayName: selected.applicationData?.fullName || selected.userName || "Loueur",
            email: selected.userEmail,
            phone: selected.applicationData?.phone || null,
            city: selected.applicationData?.city || null,
            businessName: selected.applicationData?.businessName || null,
            documents: selected.documents || {},
            status: "active",
            verifiedAt: serverTimestamp(),
            verifiedBy: user.uid,
            createdAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      // Notify the user
      await setDoc(
        doc(db, "notifications", `${selected.userId}_lessor_${Date.now()}`),
        {
          userId: selected.userId,
          type: "role_request",
          title: action === "approve"
            ? "Demande Loueur approuvée ✅"
            : "Demande Loueur refusée",
          body: action === "approve"
            ? "Bienvenue ! Vous pouvez à présent publier des équipements à louer."
            : (comment.trim() || "Votre demande n'a pas été acceptée."),
          data: { requestId: selected.id, role: "lessor" },
          read: false,
          createdAt: serverTimestamp(),
        },
      );

      toast.success(action === "approve" ? "Loueur approuvé" : "Demande refusée");
      setAction(null);
      setSelected(null);
      setComment("");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du traitement.");
    } finally {
      setProcessing(false);
    }
  };

  const renderCard = (req: LessorRequest) => {
    const ad = req.applicationData;
    const docs = req.documents || {};
    const docCount = Object.keys(docs).length;
    return (
      <Card key={req.id}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="w-11 h-11 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {(req.userName || req.userEmail || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold">{ad?.fullName || req.userName || "Sans nom"}</p>
                  <p className="text-xs text-muted-foreground truncate">{req.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <CalendarDays className="w-3 h-3 text-primary" /> Loueur
                  </Badge>
                  {req.status === "pending" && (
                    <Badge variant="secondary" className="gap-1 text-amber-600">
                      <Clock className="w-3 h-3" /> En attente
                    </Badge>
                  )}
                  {req.status === "approved" && (
                    <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      <Check className="w-3 h-3" /> Approuvé
                    </Badge>
                  )}
                  {req.status === "rejected" && (
                    <Badge variant="destructive" className="gap-1">
                      <X className="w-3 h-3" /> Refusé
                    </Badge>
                  )}
                </div>
              </div>

              {ad && (
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" /> {ad.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" /> {ad.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" /> {ad.city} — {ad.address}
                  </div>
                  {ad.businessName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" /> {ad.businessName}
                    </div>
                  )}
                </div>
              )}

              {ad?.equipmentTypes && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="font-medium">Matériel :</span> {ad.equipmentTypes}
                </div>
              )}

              {req.motivation && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <span className="font-medium">Motivation :</span> {req.motivation}
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Documents fournis ({docCount})
                </p>
                {docCount === 0 ? (
                  <p className="text-xs text-destructive">Aucun document fourni</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {Object.entries(docs).map(([key, v]) =>
                      v?.url ? (
                        <a
                          key={key}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary hover:bg-accent/30 transition-colors"
                        >
                          <span className="truncate">{DOC_LABELS[key] || key}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </a>
                      ) : null,
                    )}
                  </div>
                )}
              </div>

              {/* Audit trail */}
              {req.reviewHistory && req.reviewHistory.length > 0 && (
                <div className="border-l-2 border-primary/40 pl-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Historique
                  </p>
                  {req.reviewHistory.map((h, i) => (
                    <div key={i} className="text-xs">
                      <span className={cn(
                        "font-medium",
                        h.action === "approved" && "text-emerald-600",
                        h.action === "rejected" && "text-destructive",
                      )}>
                        {h.action === "approved" ? "Approuvé" : h.action === "rejected" ? "Refusé" : "Info demandée"}
                      </span>{" "}
                      par <strong>{h.byName || h.by}</strong> — {fmtDate(h.at)}
                      {h.comment && <p className="text-muted-foreground mt-0.5">« {h.comment} »</p>}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Demande créée le {fmtDate(req.createdAt)}
                </span>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => openAction(req, "reject")}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Refuser
                    </Button>
                    <Button size="sm" onClick={() => openAction(req, "approve")}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Approuver
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout
      title="Demandes Loueur"
      description="Examinez les documents, approuvez ou refusez les demandes loueur."
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approuvées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <X className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Refusées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-4 h-4" />
            En attente
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-1.5">
            <Eye className="w-4 h-4" /> Traitées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Chargement...</CardContent></Card>
          ) : pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            pending.map(renderCard)
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4 mt-4">
          {processed.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune demande traitée</CardContent></Card>
          ) : (
            processed.map(renderCard)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!action} onOpenChange={(o) => { if (!o) { setAction(null); setSelected(null); } }}>
        <DialogContent>
          {selected && action && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {action === "approve" ? "Approuver la demande Loueur" : "Refuser la demande Loueur"}
                </DialogTitle>
                <DialogDescription>
                  {selected.applicationData?.fullName || selected.userName || selected.userEmail}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {action === "approve" ? "Commentaire (optionnel)" : "Motif du refus *"}
                </label>
                <Textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={action === "approve"
                    ? "Bienvenue ! Documents conformes."
                    : "Document illisible / informations incomplètes…"}
                />
                <p className="text-xs text-muted-foreground">
                  Ce commentaire sera enregistré dans l'historique et envoyé à l'utilisateur.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAction(null)} disabled={processing}>
                  Annuler
                </Button>
                <Button
                  variant={action === "approve" ? "default" : "destructive"}
                  onClick={handleSubmit}
                  disabled={processing}
                >
                  {processing && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {action === "approve" ? "Confirmer l'approbation" : "Confirmer le refus"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
