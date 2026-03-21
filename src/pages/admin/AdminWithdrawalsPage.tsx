/**
 * ADMIN WITHDRAWALS PAGE
 * Manage withdrawal requests from sellers and couriers (approve/reject)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  Wallet,
  ArrowUpFromLine,
  Filter,
  Search,
  Users,
  Store,
  Truck,
  Ban,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGNF } from "@/hooks/useWallet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminWithdrawal {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: "orange_money" | "mtn_money" | "cash";
  phone?: string;
  status: "pending" | "approved" | "completed" | "rejected";
  rejectionReason?: string;
  createdAt: Date;
  completedAt?: Date;
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: {
    label: "En attente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  approved: {
    label: "Approuvé",
    icon: CheckCircle2,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  completed: {
    label: "Complété",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  rejected: {
    label: "Rejeté",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const methodLabels: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_money: "MTN Money",
  cash: "Cash",
};

export default function AdminWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();

  // Fetch all withdrawals
  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          userName: data.userName || "Utilisateur",
          userRole: data.userRole || "unknown",
          amount: data.amount,
          fee: data.fee || 0,
          netAmount: data.netAmount || data.amount,
          method: data.method,
          phone: data.phone,
          status: data.status,
          rejectionReason: data.rejectionReason,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          completedAt: data.completedAt
            ? data.completedAt instanceof Timestamp
              ? data.completedAt.toDate()
              : new Date(data.completedAt)
            : undefined,
        } as AdminWithdrawal;
      });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await updateDoc(doc(db, "withdrawals", id), {
        status: "approved",
        approvedAt: new Date(),
      });
    },
    onSuccess: () => {
      toast.success("Demande approuvée");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await updateDoc(doc(db, "withdrawals", id), {
        status: "rejected",
        rejectionReason: reason,
        rejectedAt: new Date(),
      });
    },
    onSuccess: () => {
      toast.success("Demande rejetée");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedWithdrawal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await updateDoc(doc(db, "withdrawals", id), {
        status: "completed",
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      toast.success("Retrait marqué comme complété");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const filtered = withdrawals.filter((w) => {
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (roleFilter !== "all" && w.userRole !== roleFilter) return false;
    if (searchTerm && !w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) && !w.phone?.includes(searchTerm)) return false;
    return true;
  });

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const approvedCount = withdrawals.filter((w) => w.status === "approved").length;
  const completedTotal = withdrawals.filter((w) => w.status === "completed").reduce((s, w) => s + w.amount, 0);
  const pendingTotal = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0);

  const openRejectDialog = (w: AdminWithdrawal) => {
    setSelectedWithdrawal(w);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Demandes de retrait</h1>
            <p className="text-muted-foreground">Gérez les demandes de retrait des vendeurs et coursiers</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-xl font-bold text-foreground">{pendingCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                  <p className="text-xl font-bold text-foreground">{approvedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Wallet className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant en attente</p>
                  <p className="text-xl font-bold text-foreground">{formatGNF(pendingTotal)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <ArrowUpFromLine className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total versé</p>
                  <p className="text-xl font-bold text-foreground">{formatGNF(completedTotal)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Users className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="seller">Vendeurs</SelectItem>
                    <SelectItem value="courier">Coursiers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {filtered.length} demande{filtered.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune demande de retrait trouvée
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Frais</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((w) => {
                      const sc = statusConfig[w.status];
                      const StatusIcon = sc.icon;
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{w.userName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {w.userRole === "seller" ? (
                                <Store className="w-3 h-3" />
                              ) : (
                                <Truck className="w-3 h-3" />
                              )}
                              {w.userRole === "seller" ? "Vendeur" : "Coursier"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{formatGNF(w.amount)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatGNF(w.fee)}</TableCell>
                          <TableCell className="font-medium">{formatGNF(w.netAmount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">{methodLabels[w.method]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{w.phone || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", sc.className)}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {w.createdAt.toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {w.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                                    onClick={() => approveMutation.mutate(w.id)}
                                    disabled={approveMutation.isPending}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => openRejectDialog(w)}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Rejeter
                                  </Button>
                                </>
                              )}
                              {w.status === "approved" && (
                                <Button
                                  size="sm"
                                  className="h-8 gap-1"
                                  onClick={() => completeMutation.mutate(w.id)}
                                  disabled={completeMutation.isPending}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Compléter
                                </Button>
                              )}
                              {w.status === "rejected" && w.rejectionReason && (
                                <span className="text-xs text-destructive max-w-[150px] truncate" title={w.rejectionReason}>
                                  {w.rejectionReason}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Rejection Dialog */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejeter la demande</DialogTitle>
                <DialogDescription>
                  Retrait de {selectedWithdrawal && formatGNF(selectedWithdrawal.amount)} par{" "}
                  {selectedWithdrawal?.userName}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Motif du rejet (obligatoire)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  onClick={() => {
                    if (selectedWithdrawal) {
                      rejectMutation.mutate({ id: selectedWithdrawal.id, reason: rejectionReason });
                    }
                  }}
                >
                  {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmer le rejet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
