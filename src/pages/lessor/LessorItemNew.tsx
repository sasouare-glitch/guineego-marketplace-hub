import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage, uploadFile } from "@/lib/firebase/storage";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ImagePlus, X, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RENTAL_CATEGORIES } from "@/constants/rentalCategories";
import type { RentalCategoryId } from "@/types/rental";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB raw

interface ImagePreview {
  file: File;
  preview: string;
}

export default function LessorItemNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as RentalCategoryId | "",
    pricePerDay: "",
    pricePerHour: "",
    deposit: "",
    minDays: "1",
    commune: "",
    quartier: "",
    address: "",
    rules: "",
  });

  const errors: Record<string, string> = {};
  if (form.title && form.title.trim().length < 3) errors.title = "Min. 3 caractères";
  if (form.title.length > 80) errors.title = "Max. 80 caractères";
  if (form.description.length > 1000) errors.description = "Max. 1000 caractères";
  if (form.pricePerDay && Number(form.pricePerDay) <= 0) errors.pricePerDay = "Prix invalide";
  if (form.pricePerHour && Number(form.pricePerHour) < 0) errors.pricePerHour = "Prix invalide";
  if (form.deposit && Number(form.deposit) < 0) errors.deposit = "Caution invalide";
  if (form.minDays && Number(form.minDays) < 1) errors.minDays = "Min. 1 jour";

  const canSubmit =
    !!user?.uid &&
    form.title.trim().length >= 3 &&
    !!form.category &&
    Number(form.pricePerDay) > 0 &&
    Number(form.deposit) >= 0 &&
    form.commune.trim().length > 0 &&
    images.length > 0 &&
    Object.keys(errors).length === 0 &&
    !submitting;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const accepted: ImagePreview[] = [];
    for (const f of files.slice(0, remaining)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "Image trop lourde", description: `${f.name} dépasse 8 Mo`, variant: "destructive" });
        continue;
      }
      accepted.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setImages((prev) => [...prev, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setSubmitting(true);
    const tempId = `${user.uid}_${Date.now().toString(36)}`;
    const urls: string[] = [];

    try {
      setUploading(true);
      setProgress(0);
      for (let i = 0; i < images.length; i++) {
        try {
          const blob = await compressImage(images[i].file, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.82,
            mimeType: "image/webp",
          });
          const path = `rental_items/${user.uid}/${tempId}/${i}.webp`;
          const upload = uploadFile(blob, path, (p) =>
            setProgress(((i + p / 100) / images.length) * 100)
          );
          const timeout = new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("Upload timeout")), 30000)
          );
          const res = await Promise.race([upload, timeout]);
          urls.push(res.url);
        } catch (err) {
          console.warn("[LessorItemNew] image upload failed", err);
        }
      }
      setUploading(false);

      if (urls.length === 0) {
        toast({
          title: "Échec d'upload",
          description: "Aucune image n'a pu être envoyée.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, "rental_items"), {
        ownerId: user.uid,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        images: urls,
        thumbnail: urls[0],
        pricePerDay: Number(form.pricePerDay),
        ...(form.pricePerHour ? { pricePerHour: Number(form.pricePerHour) } : {}),
        deposit: Number(form.deposit) || 0,
        minDays: Number(form.minDays) || 1,
        location: {
          commune: form.commune.trim(),
          ...(form.quartier ? { quartier: form.quartier.trim() } : {}),
          ...(form.address ? { address: form.address.trim() } : {}),
        },
        ...(form.rules ? { rules: form.rules.trim() } : {}),
        status: "active",
        avgRating: 0,
        totalRentals: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      images.forEach((i) => URL.revokeObjectURL(i.preview));
      toast({ title: "Équipement publié", description: "Votre annonce est en ligne." });
      navigate("/lessor/items");
    } catch (err: any) {
      console.error("[LessorItemNew] submit error", err);
      toast({
        title: "Erreur",
        description: err?.message || "Impossible d'enregistrer l'équipement",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Link
            to="/lessor/items"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>

          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-1">Créer un équipement</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Renseignez les informations de votre équipement à louer.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Toyota Hilux 2022 - 4x4"
                  maxLength={80}
                  required
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="État, options, conditions d'utilisation…"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{form.description.length}/1000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as RentalCategoryId }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Choisir une catégorie…</option>
                  {RENTAL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerDay">Prix / jour (GNF) *</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    min="1"
                    value={form.pricePerDay}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                    placeholder="500000"
                    required
                  />
                  {errors.pricePerDay && (
                    <p className="text-xs text-destructive">{errors.pricePerDay}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Prix / heure (optionnel)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    min="0"
                    value={form.pricePerHour}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerHour: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit">Caution (GNF) *</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    value={form.deposit}
                    onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))}
                    placeholder="1000000"
                    required
                  />
                  {errors.deposit && <p className="text-xs text-destructive">{errors.deposit}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minDays">Durée min. (jours)</Label>
                  <Input
                    id="minDays"
                    type="number"
                    min="1"
                    value={form.minDays}
                    onChange={(e) => setForm((f) => ({ ...f, minDays: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4">
                <Label className="text-sm font-semibold">Localisation</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commune">Commune *</Label>
                    <Input
                      id="commune"
                      value={form.commune}
                      onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
                      placeholder="Kaloum"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quartier">Quartier</Label>
                    <Input
                      id="quartier"
                      value={form.quartier}
                      onChange={(e) => setForm((f) => ({ ...f, quartier: e.target.value }))}
                      placeholder="Almamya"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse précise</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Rue, repère…"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Règles d'utilisation</Label>
                <Textarea
                  id="rules"
                  value={form.rules}
                  onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
                  placeholder="Permis requis, kilométrage limité, interdiction de fumer…"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Photos * (max {MAX_IMAGES})</Label>
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                    >
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    >
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Ajouter</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
                <p className="text-xs text-muted-foreground">
                  Au moins une photo. Compression auto en WebP.
                </p>
              </div>

              {uploading && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="w-4 h-4 animate-pulse" />
                    <span>Upload des images…</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/lessor/items")}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication…
                    </>
                  ) : (
                    "Publier l'équipement"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
