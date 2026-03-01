import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X, Upload, Loader2 } from "lucide-react";
import { uploadProductImage } from "@/lib/firebase/storage";
import type { SellerProduct } from "@/hooks/useSellerProducts";
import { CATEGORY_NAMES } from "@/constants/categories";

interface ImagePreview {
  file?: File;
  preview: string;
  isExisting: boolean;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: SellerProduct;
  onSubmit: (productId: string, data: Partial<SellerProduct>) => Promise<void>;
}

export function EditProductDialog({ open, onOpenChange, product, onSubmit }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    tags: "",
  });

  useEffect(() => {
    if (open && product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        basePrice: String(product.basePrice || product.price || ""),
        tags: (product.tags || []).join(", "),
      });
      // Load existing images
      const existingImages: ImagePreview[] = (product.images || [])
        .filter((url) => url && url !== "/placeholder.svg")
        .map((url) => ({ preview: url, isExisting: true }));
      setImages(existingImages);
    }
  }, [open, product]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) return;
    const newPreviews: ImagePreview[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));
    setImages((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      if (!prev[index].isExisting) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.basePrice) return;

    setLoading(true);
    try {
      // Separate existing URLs from new files to upload
      const existingUrls = images.filter((img) => img.isExisting).map((img) => img.preview);
      const newFiles = images.filter((img) => !img.isExisting && img.file);

      let newUrls: string[] = [];
      if (newFiles.length > 0) {
        setUploadingImages(true);
        setUploadProgress(0);
        const total = newFiles.length;
        try {
          for (let i = 0; i < newFiles.length; i++) {
            const uploadPromise = uploadProductImage(
              newFiles[i].file!,
              product.id,
              existingUrls.length + i,
              (p) => setUploadProgress(((i + p / 100) / total) * 100)
            );
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Upload timeout")), 30000)
            );
            const result = await Promise.race([uploadPromise, timeoutPromise]);
            newUrls.push(result.url);
          }
        } catch (uploadError) {
          console.warn("Image upload failed:", uploadError);
        }
        setUploadingImages(false);
      }

      const allImages = [...existingUrls, ...newUrls];

      await onSubmit(product.id, {
        name: form.name,
        description: form.description,
        category: form.category,
        basePrice: Number(form.basePrice),
        price: Number(form.basePrice),
        images: allImages.length > 0 ? allImages : ["/placeholder.svg"],
        thumbnail: allImages[0] || "/placeholder.svg",
        tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
      });
      onOpenChange(false);
    } catch {
      // error handled in hook
    } finally {
      setLoading(false);
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom du produit *</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_NAMES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Prix (GNF) *</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Images du produit (max 5)</Label>
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
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
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
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
              onChange={handleFilesSelected}
            />
          </div>

          {/* Upload Progress */}
          {uploadingImages && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="w-4 h-4 animate-pulse" />
                <span>Compression & upload des images...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (séparés par des virgules)</Label>
            <Input
              id="edit-tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !form.name || !form.category || !form.basePrice}>
              {uploadingImages ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upload...</>
              ) : loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
