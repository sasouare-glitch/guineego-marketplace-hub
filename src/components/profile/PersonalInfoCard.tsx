import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { updateProfile as firebaseUpdateProfile } from "firebase/auth";
import { uploadAvatar } from "@/lib/firebase/storage";

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface PersonalInfoCardProps {
  user: UserInfo;
  onSave?: (user: UserInfo) => void;
}

export function PersonalInfoCard({ user, onSave }: PersonalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: firebaseUser } = useAuth();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(file, firebaseUser.uid);
      
      // Update Firebase Auth photoURL
      await firebaseUpdateProfile(firebaseUser, { photoURL: result.url });
      
      // Update Firestore
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        photoURL: result.url,
        'metadata.updatedAt': serverTimestamp(),
      });

      setFormData(prev => ({ ...prev, avatar: result.url }));
      toast.success("Photo de profil mise à jour");
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error("Erreur lors de l'upload de la photo");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    setIsSaving(true);
    try {
      // Update Firestore profile
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          language: 'fr',
          currency: 'GNF',
        },
        'metadata.updatedAt': serverTimestamp(),
      });

      // Update Firebase Auth displayName
      await firebaseUpdateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      onSave?.(formData);
      setIsEditing(false);
      toast.success("Profil mis à jour avec succès");
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Informations personnelles</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar} />
                <AvatarFallback className="text-xl">
                  {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
