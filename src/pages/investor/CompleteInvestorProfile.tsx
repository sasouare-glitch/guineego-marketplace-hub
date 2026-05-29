/**
 * CompleteInvestorProfile
 *
 * Page de complétion de profil affichée lorsqu'un utilisateur
 * (typiquement venu via Google Sign-In) tente d'accéder à l'espace
 * investisseur sans avoir le rôle `investor`.
 *
 * Flux :
 *  1. Pré-remplir nom / email depuis le compte Google
 *  2. Recueillir téléphone (validé GN: 9 chiffres commençant par 6/3),
 *     pays, capacité d'investissement, motivation
 *  3. Mettre à jour `users/{uid}` avec les infos investisseur
 *  4. Créer (ou mettre à jour) `role_requests/{uid}_investor` en statut
 *     `pending` afin qu'un admin valide
 *  5. Si déjà investor → redirection immédiate vers `/investor/dashboard`
 *  6. Si la demande est déjà `pending` → afficher l'état d'attente
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Loader2, ShieldCheck } from "lucide-react";

// Validation téléphone Guinée: 9 chiffres commençant par 6 ou 3.
const PHONE_RE = /^[63]\d{8}$/;

type Status = "idle" | "loading" | "pending" | "approved";

export default function CompleteInvestorProfile() {
  const { user, claims, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fallback = params.get("from") || "/investor/dashboard";

  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    country: "GN",
    capacity: "",
    motivation: "",
  });

  // Pré-remplit depuis le compte Google / profil existant
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      displayName: f.displayName || user.displayName || profile?.displayName || "",
      phone: f.phone || (profile?.phone ?? "").replace(/^\+?224/, ""),
    }));
  }, [user, profile]);

  // Détecte l'état actuel: déjà investor ? demande en cours ?
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login?from=" + encodeURIComponent(fallback), { replace: true });
      return;
    }

    const role = claims?.role;
    const roles = (claims?.roles as string[] | undefined) ?? [];
    if (role === "investor" || roles.includes("investor") || role === "admin") {
      setStatus("approved");
      navigate(fallback, { replace: true });
      return;
    }

    (async () => {
      try {
        const reqSnap = await getDoc(doc(db, "role_requests", `${user.uid}_investor`));
        if (reqSnap.exists() && reqSnap.data()?.status === "pending") {
          setStatus("pending");
        } else {
          setStatus("idle");
        }
      } catch (e) {
        console.error("[CompleteInvestorProfile] load request error", e);
        setStatus("idle");
      }
    })();
  }, [user, claims, authLoading, navigate, fallback]);

  const phoneError = useMemo(() => {
    if (!form.phone) return null;
    return PHONE_RE.test(form.phone) ? null : "Téléphone invalide (9 chiffres, commence par 6 ou 3)";
  }, [form.phone]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (!form.displayName.trim()) return setError("Nom complet requis");
    if (!PHONE_RE.test(form.phone)) return setError("Téléphone invalide");
    if (!form.motivation.trim() || form.motivation.trim().length < 20) {
      return setError("Décrivez votre motivation (au moins 20 caractères)");
    }
    const capacityNum = Number(form.capacity.replace(/\s+/g, ""));
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      return setError("Capacité d'investissement invalide");
    }

    setSubmitting(true);
    try {
      // 1) Mettre à jour le doc utilisateur avec les infos investisseur
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: form.displayName.trim(),
        phoneNumber: `+224${form.phone}`,
        country: form.country,
        investorProfile: {
          country: form.country,
          investmentCapacity: capacityNum,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        // doc inexistant → setDoc avec merge
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: form.displayName.trim(),
            phoneNumber: `+224${form.phone}`,
            country: form.country,
            role: profile?.role ?? "customer",
            investorProfile: {
              country: form.country,
              investmentCapacity: capacityNum,
              updatedAt: serverTimestamp(),
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      // 2) Créer la demande de rôle investor
      await setDoc(doc(db, "role_requests", `${user.uid}_investor`), {
        userId: user.uid,
        userEmail: user.email,
        userName: form.displayName.trim(),
        userPhone: `+224${form.phone}`,
        requestedRole: "investor",
        motivation: form.motivation.trim(),
        investmentCapacity: capacityNum,
        country: form.country,
        status: "pending",
        currentRoles: claims?.roles ?? (claims?.role ? [claims.role] : []),
        source: "google_signin_completion",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Profil envoyé. Un administrateur va valider votre accès investisseur.");
      setStatus("pending");
    } catch (err: any) {
      console.error("[CompleteInvestorProfile] submit error", err);
      setError(err?.message || "Impossible d'envoyer la demande, réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profil investisseur incomplet</AlertTitle>
          <AlertDescription>
            Votre compte Google ne contient pas le rôle <strong>investisseur</strong>.
            Complétez votre profil ci-dessous pour demander l'accès à l'espace investisseur.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Devenir investisseur
            </CardTitle>
            <CardDescription>
              Ces informations seront utilisées par notre équipe pour valider votre profil.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {status === "pending" ? (
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Demande en cours d'examen</AlertTitle>
                  <AlertDescription>
                    Votre demande d'accès investisseur a bien été reçue. Vous serez
                    redirigé(e) vers l'espace investisseur dès qu'un administrateur
                    l'aura validée.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/">Retour à l'accueil</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/profile">Voir mon profil</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayName">Nom complet</Label>
                  <Input
                    id="displayName"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Votre nom complet"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone (Guinée)</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        +224
                      </span>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                        placeholder="6XXXXXXXX"
                        className="rounded-l-none"
                        required
                      />
                    </div>
                    {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Pays de résidence</Label>
                    <select
                      id="country"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="GN">Guinée</option>
                      <option value="SN">Sénégal</option>
                      <option value="CI">Côte d'Ivoire</option>
                      <option value="ML">Mali</option>
                      <option value="FR">France</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité d'investissement (GNF)</Label>
                  <Input
                    id="capacity"
                    inputMode="numeric"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value.replace(/[^\d]/g, "") })}
                    placeholder="Ex: 50 000 000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Motivation</Label>
                  <Textarea
                    id="motivation"
                    rows={4}
                    maxLength={1000}
                    value={form.motivation}
                    onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                    placeholder="Pourquoi souhaitez-vous investir via Sarematy ? (min. 20 caractères)"
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.motivation.length}/1000
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:flex-1"
                    onClick={() => navigate("/")}
                    disabled={submitting}
                  >
                    Plus tard
                  </Button>
                  <Button type="submit" className="sm:flex-[2]" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      "Demander l'accès investisseur"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
