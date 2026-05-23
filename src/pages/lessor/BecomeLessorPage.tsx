import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import {
  CalendarDays,
  Upload,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Loader2,
  Send,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { uploadFile } from "@/lib/firebase/storage";

const phoneRegex = /^(6|3)\d{8}$/;

const lessorSchema = z.object({
  fullName: z.string().trim().min(2, "Nom requis").max(100),
  phone: z.string().trim().regex(phoneRegex, "Téléphone invalide (9 chiffres, commence par 6 ou 3)"),
  email: z.string().trim().email("Email invalide").max(255),
  city: z.string().trim().min(2, "Ville requise").max(80),
  address: z.string().trim().min(3, "Adresse requise").max(200),
  businessName: z.string().trim().max(120).optional().or(z.literal("")),
  equipmentTypes: z.string().trim().min(3, "Décrivez le matériel à louer").max(500),
  motivation: z.string().trim().max(1000).optional().or(z.literal("")),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions" }),
  }),
});

type DocKey = "idDocument" | "proofOfAddress" | "businessRegistry" | "insurance";

const REQUIRED_DOCS: { key: DocKey; label: string; required: boolean; hint: string }[] = [
  { key: "idDocument", label: "Pièce d'identité (CNI / Passeport)", required: true, hint: "Recto-verso, lisible" },
  { key: "proofOfAddress", label: "Justificatif de domicile", required: true, hint: "Facture < 3 mois" },
  { key: "businessRegistry", label: "Registre de commerce (si entreprise)", required: false, hint: "Optionnel" },
  { key: "insurance", label: "Attestation d'assurance du matériel", required: false, hint: "Recommandé" },
];

const benefits = [
  { icon: Wallet, title: "Revenus passifs", desc: "Rentabilisez votre matériel inutilisé." },
  { icon: ShieldCheck, title: "Caution sécurisée", desc: "Caution gérée et remboursée via la plateforme." },
  { icon: TrendingUp, title: "Visibilité élargie", desc: "Accédez à des milliers de locataires en Guinée." },
];

export default function BecomeLessorPage() {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<Partial<Record<DocKey, File>>>({});
  const [form, setForm] = useState({
    fullName: user?.displayName ?? "",
    phone: "",
    email: user?.email ?? "",
    city: "",
    address: "",
    businessName: "",
    equipmentTypes: "",
    motivation: "",
    acceptTerms: false as boolean,
  });

  const isAlreadyLessor = userRoles?.includes("lessor");

  const handleFile = (key: DocKey, file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté pour soumettre une demande.");
      navigate("/login?redirect=/become-lessor");
      return;
    }

    const parsed = lessorSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Formulaire invalide");
      return;
    }

    const missing = REQUIRED_DOCS.filter((d) => d.required && !files[d.key]);
    if (missing.length > 0) {
      toast.error(`Documents manquants: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const uploaded: Record<string, { url: string; path: string }> = {};
      for (const docDef of REQUIRED_DOCS) {
        const file = files[docDef.key];
        if (!file) continue;
        const ext = file.name.split(".").pop() || "bin";
        const path = `role_requests/${user.uid}/lessor/${docDef.key}_${Date.now()}.${ext}`;
        const res = await uploadFile(file, path);
        uploaded[docDef.key] = { url: res.url, path: res.path };
      }

      await setDoc(doc(db, "role_requests", `${user.uid}_lessor`), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        requestedRole: "lessor",
        status: "pending",
        currentRoles: userRoles,
        applicationData: {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          city: form.city,
          address: form.address,
          businessName: form.businessName || null,
          equipmentTypes: form.equipmentTypes,
        },
        motivation: form.motivation || null,
        documents: uploaded,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Demande envoyée ! Notre équipe vous répondra sous 48h.");
      navigate("/profile");
    } catch (err) {
      console.error("Lessor application error:", err);
      toast.error("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-hero-gradient text-primary-foreground py-16">
          <div className="container-tight text-center">
            <Badge variant="secondary" className="mb-4">Programme Loueur</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Devenir loueur sur Sarematy
            </h1>
            <p className="text-lg text-primary-foreground/85 max-w-2xl mx-auto">
              Mettez votre matériel en location et générez un revenu complémentaire en toute sécurité.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="container-tight py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <b.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Form */}
        <section className="container-tight pb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Formulaire d'inscription Loueur
              </CardTitle>
              {isAlreadyLessor && (
                <p className="text-sm text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Vous êtes déjà loueur. Vous pouvez accéder à votre espace.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {isAlreadyLessor ? (
                <Button asChild>
                  <Link to="/lessor">Aller à mon espace loueur</Link>
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nom complet *</Label>
                      <Input
                        id="fullName"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        placeholder="6XXXXXXXX"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Ville / Commune *</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="businessName">Nom commercial (si applicable)</Label>
                      <Input
                        id="businessName"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="equipmentTypes">Types de matériel à louer *</Label>
                      <Textarea
                        id="equipmentTypes"
                        rows={3}
                        placeholder="Ex: outillage BTP, sono, mobilier événementiel, véhicules..."
                        value={form.equipmentTypes}
                        onChange={(e) => setForm({ ...form, equipmentTypes: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="motivation">Motivation (optionnel)</Label>
                      <Textarea
                        id="motivation"
                        rows={3}
                        value={form.motivation}
                        onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Documents requis
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {REQUIRED_DOCS.map((d) => {
                        const file = files[d.key];
                        return (
                          <label
                            key={d.key}
                            className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors block"
                          >
                            <div className="flex items-start gap-3">
                              <Upload className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium flex items-center gap-2">
                                  {d.label}
                                  {d.required && <Badge variant="outline" className="text-xs">Requis</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">{d.hint}</div>
                                {file && (
                                  <div className="text-xs text-emerald-600 mt-1 truncate flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> {file.name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleFile(d.key, e.target.files?.[0] ?? null)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={form.acceptTerms}
                      onCheckedChange={(c) => setForm({ ...form, acceptTerms: c === true })}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                      J'accepte les conditions du programme Loueur, la commission de la plateforme et la
                      politique de caution.
                    </Label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={submitting} size="lg" className="gap-2">
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
                    </Button>
                    {!user && (
                      <Button type="button" variant="outline" asChild>
                        <Link to="/login?redirect=/become-lessor">Se connecter d'abord</Link>
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
