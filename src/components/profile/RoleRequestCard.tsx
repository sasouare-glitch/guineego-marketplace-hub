import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Store, Truck, TrendingUp, Target, Check, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  requirements: string[];
}

const REQUESTABLE_ROLES: RoleOption[] = [
  {
    role: 'ecommerce',
    label: 'Vendeur',
    description: 'Vendez vos produits sur la marketplace',
    icon: Store,
    color: 'text-emerald-500',
    requirements: ['Pièce d\'identité valide', 'Numéro de téléphone vérifié'],
  },
  {
    role: 'courier',
    label: 'Livreur',
    description: 'Effectuez des livraisons et gagnez de l\'argent',
    icon: Truck,
    color: 'text-orange-500',
    requirements: ['Permis de conduire ou carte d\'identité', 'Moyen de transport'],
  },
  {
    role: 'closer',
    label: 'Closer',
    description: 'Finalisez les ventes pour les e-commerçants',
    icon: Target,
    color: 'text-purple-500',
    requirements: ['Expérience en vente', 'Bonne communication'],
  },
  {
    role: 'investor',
    label: 'Investisseur',
    description: 'Investissez dans des opportunités rentables',
    icon: TrendingUp,
    color: 'text-amber-500',
    requirements: ['Capital minimum requis', 'Document d\'identité'],
  },
];

type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function RoleRequestCard() {
  const { state, userRoles } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, RequestStatus>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const user = state.user;

  const checkRequestStatus = async (role: UserRole): Promise<RequestStatus> => {
    if (!user) return 'none';
    try {
      const reqDoc = await getDoc(doc(db, 'role_requests', `${user.uid}_${role}`));
      if (reqDoc.exists()) {
        return reqDoc.data().status as RequestStatus;
      }
    } catch {
      // ignore
    }
    return 'none';
  };

  const openRequest = async (option: RoleOption) => {
    const status = await checkRequestStatus(option.role);
    setRequestStatuses(prev => ({ ...prev, [option.role]: status }));
    if (status === 'pending') {
      toast.info('Votre demande est déjà en cours de traitement');
      return;
    }
    if (status === 'approved') {
      toast.info('Ce rôle vous a déjà été attribué');
      return;
    }
    setSelectedRole(option);
    setMotivation('');
    setDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!user || !selectedRole) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'role_requests', `${user.uid}_${selectedRole.role}`), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        requestedRole: selectedRole.role,
        motivation,
        status: 'pending',
        currentRoles: userRoles,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setRequestStatuses(prev => ({ ...prev, [selectedRole.role]: 'pending' }));
      toast.success('Demande envoyée ! Vous serez notifié une fois traitée.');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error submitting role request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (role: UserRole) => {
    if (userRoles.includes(role)) {
      return <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Actif</Badge>;
    }
    const status = requestStatuses[role];
    if (status === 'pending') {
      return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><Clock className="w-3 h-3" /> En attente</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive" className="gap-1">Refusé</Badge>;
    }
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Devenir partenaire</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajoutez un rôle à votre compte pour accéder à de nouvelles fonctionnalités
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {REQUESTABLE_ROLES.map((option) => {
            const Icon = option.icon;
            const isActive = userRoles.includes(option.role);
            return (
              <div
                key={option.role}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-all",
                  isActive
                    ? "bg-muted/50 border-border"
                    : "hover:border-primary/30 hover:bg-accent/50 cursor-pointer"
                )}
                onClick={() => !isActive && openRequest(option)}
              >
                <div className={cn("p-2 rounded-lg bg-background shadow-sm", isActive && "opacity-60")}>
                  <Icon className={cn("w-5 h-5", option.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{option.label}</span>
                    {getStatusBadge(option.role)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
                {!isActive && requestStatuses[option.role] !== 'pending' && (
                  <Button variant="outline" size="sm" className="shrink-0">
                    Demander
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedRole && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <selectedRole.icon className={cn("w-5 h-5", selectedRole.color)} />
                  Devenir {selectedRole.label}
                </DialogTitle>
                <DialogDescription>{selectedRole.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Prérequis</h4>
                  <ul className="space-y-1">
                    {selectedRole.requirements.map((req, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="text-sm font-medium">Motivation (optionnel)</label>
                  <Textarea
                    placeholder="Pourquoi souhaitez-vous devenir vendeur/livreur..."
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={submitRequest} disabled={submitting} className="gap-2">
                  <Send className="w-4 h-4" />
                  {submitting ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
