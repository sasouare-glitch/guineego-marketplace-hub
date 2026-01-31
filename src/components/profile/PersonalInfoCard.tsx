import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface PersonalInfoCardProps {
  user: UserInfo;
  onSave: (user: UserInfo) => void;
}

export function PersonalInfoCard({ user, onSave }: PersonalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSave(formData);
    setIsEditing(false);
    setIsSaving(false);
    toast.success("Profil mis à jour");
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
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
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
