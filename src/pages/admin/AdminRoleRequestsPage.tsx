/**
 * ADMIN PAGE: Role Requests Management
 * Approve or reject user role requests
 */

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Store, Truck, TrendingUp, Target, Shield,
  Check, X, Clock, Eye, UserPlus, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/auth";
import {
  collection, query, where, onSnapshot, doc, updateDoc,
  serverTimestamp, orderBy, getDoc, setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

interface RoleRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  requestedRole: UserRole;
  motivation: string;
  status: "pending" | "approved" | "rejected";
  currentRoles: UserRole[];
  adminNote?: string;
  reviewedBy?: string;
  createdAt: any;
  updatedAt: any;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ecommerce: { label: "Vendeur", icon: Store, color: "text-emerald-500" },
  courier: { label: "Livreur", icon: Truck, color: "text-orange-500" },
  closer: { label: "Closer", icon: Target, color: "text-purple-500" },
  investor: { label: "Investisseur", icon: TrendingUp, color: "text-amber-500" },
  admin: { label: "Admin", icon: Shield, color: "text-destructive" },
};

export default function AdminRoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "role_requests"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoleRequest));
      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading role requests:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      // Update request status
      await updateDoc(doc(db, "role_requests", selectedRequest.id), {
        status: action === "approve" ? "approved" : "rejected",
        adminNote: adminNote || null,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If approved, add the role to the user's roles array in Firestore
      if (action === "approve") {
        const userRef = doc(db, "users", selectedRequest.userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data() || {};
        const existingRoles: UserRole[] = userData.roles || [userData.role || "customer"];
        
        if (!existingRoles.includes(selectedRequest.requestedRole)) {
          const newRoles = [...existingRoles, selectedRequest.requestedRole];
          await updateDoc(userRef, {
            roles: newRoles,
            updatedAt: serverTimestamp(),
          });
        }

        // Auto-provision profile if needed
        if (selectedRequest.requestedRole === "ecommerce") {
          const sellerRef = doc(db, "sellers", selectedRequest.userId);
          const sellerDoc = await getDoc(sellerRef);
          if (!sellerDoc.exists()) {
            await setDoc(sellerRef, {
              ownerId: selectedRequest.userId,
              shopName: selectedRequest.userName || "Ma Boutique",
              email: selectedRequest.userEmail,
              status: "active",
              createdAt: serverTimestamp(),
            }, { merge: true });
          }
        } else if (selectedRequest.requestedRole === "courier") {
          const courierRef = doc(db, "couriers", selectedRequest.userId);
          const courierDoc = await getDoc(courierRef);
          if (!courierDoc.exists()) {
            await setDoc(courierRef, {
              userId: selectedRequest.userId,
              name: selectedRequest.userName || "",
              email: selectedRequest.userEmail,
              status: "active",
              vehicleType: "moto",
              available: false,
              createdAt: serverTimestamp(),
            }, { merge: true });
          }
        }
      }

      // Notify user
      await setDoc(doc(db, "notifications", `${selectedRequest.userId}_role_${Date.now()}`), {
        userId: selectedRequest.userId,
        type: "role_request",
        title: action === "approve"
          ? `Rôle ${ROLE_CONFIG[selectedRequest.requestedRole]?.label} approuvé !`
          : `Demande de rôle ${ROLE_CONFIG[selectedRequest.requestedRole]?.label} refusée`,
        body: action === "approve"
          ? "Votre demande a été acceptée. Vous pouvez maintenant accéder à votre nouvel espace."
          : adminNote || "Votre demande n'a pas été acceptée pour le moment.",
        read: false,
        createdAt: serverTimestamp(),
      });

      toast.success(action === "approve" ? "Rôle approuvé avec succès" : "Demande refusée");
      setDialogAction(null);
      setSelectedRequest(null);
      setAdminNote("");
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("Erreur lors du traitement");
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (request: RoleRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setDialogAction(action);
    setAdminNote("");
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const formatDate = (ts: any) => {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const renderRequestCard = (req: RoleRequest) => {
    const roleConfig = ROLE_CONFIG[req.requestedRole] || { label: req.requestedRole, icon: UserPlus, color: "text-muted-foreground" };
    const Icon = roleConfig.icon;

    return (
      <Card key={req.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {(req.userName || req.userEmail || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-medium text-foreground">{req.userName || "Sans nom"}</p>
                  <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Icon className={cn("w-3 h-3", roleConfig.color)} />
                    {roleConfig.label}
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

              {req.currentRoles?.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Rôles actuels : {req.currentRoles.map(r => ROLE_CONFIG[r]?.label || r).join(", ")}
                </p>
              )}

              {req.motivation && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-foreground">{req.motivation}</p>
                </div>
              )}

              {req.adminNote && (
                <div className="bg-accent/50 rounded-lg p-3 border-l-2 border-primary">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Note admin</p>
                  <p className="text-sm">{req.adminNote}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</span>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => openActionDialog(req, "reject")}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Refuser
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openActionDialog(req, "approve")}
                    >
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
    <AdminLayout title="Demandes de rôle" description="Gérer les demandes de rôle des utilisateurs">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
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
              <p className="text-2xl font-bold text-foreground">
                {requests.filter(r => r.status === "approved").length}
              </p>
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
              <p className="text-2xl font-bold text-foreground">
                {requests.filter(r => r.status === "rejected").length}
              </p>
              <p className="text-xs text-muted-foreground">Refusées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-4 h-4" />
            En attente
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-1.5">
            <Eye className="w-4 h-4" />
            Traitées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {loading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Chargement...</CardContent></Card>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(renderRequestCard)
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4 mt-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune demande traitée
              </CardContent>
            </Card>
          ) : (
            processedRequests.map(renderRequestCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!dialogAction} onOpenChange={() => { setDialogAction(null); setSelectedRequest(null); }}>
        <DialogContent>
          {selectedRequest && dialogAction && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialogAction === "approve" ? "Approuver la demande" : "Refuser la demande"}
                </DialogTitle>
                <DialogDescription>
                  {selectedRequest.userName || selectedRequest.userEmail} souhaite devenir{" "}
                  <strong>{ROLE_CONFIG[selectedRequest.requestedRole]?.label}</strong>
                </DialogDescription>
              </DialogHeader>
              <div>
                <label className="text-sm font-medium">
                  {dialogAction === "approve" ? "Note (optionnel)" : "Raison du refus (recommandé)"}
                </label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={dialogAction === "approve" ? "Bienvenue !" : "Motif du refus..."}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAction(null)}>Annuler</Button>
                <Button
                  variant={dialogAction === "approve" ? "default" : "destructive"}
                  onClick={() => handleAction(dialogAction)}
                  disabled={processing}
                >
                  {processing ? "Traitement..." : dialogAction === "approve" ? "Confirmer l'approbation" : "Confirmer le refus"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
