/**
 * Admin Orange SMS Configuration Page
 * Allows admins to configure Orange SMS API credentials stored in Firestore config/orange_sms
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Eye, EyeOff, Send, CheckCircle2, XCircle, MessageSquare, Phone } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

export default function AdminSmsConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderName, setSenderName] = useState('GuineeGo');
  const [enabled, setEnabled] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'orange_sms'));
      if (snap.exists()) {
        const data = snap.data();
        setClientId(data.clientId || '');
        setClientSecret(data.clientSecret || '');
        setSenderAddress(data.senderAddress || '');
        setSenderName(data.senderName || 'GuineeGo');
        setEnabled(data.enabled !== false);
        setConfigured(!!(data.clientId && data.clientSecret));
        if (data.updatedAt?.toDate) {
          setLastUpdated(data.updatedAt.toDate());
        }
      }
    } catch (err) {
      console.error('Error loading SMS config:', err);
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error('Client ID et Client Secret sont requis');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'orange_sms'), {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        senderAddress: senderAddress.trim(),
        senderName: senderName.trim(),
        enabled,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setConfigured(true);
      setLastUpdated(new Date());
      toast.success('Configuration Orange SMS enregistrée');
    } catch (err) {
      console.error('Error saving SMS config:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error('Entrez un numéro de test');
      return;
    }
    setTesting(true);
    try {
      const sendTestSms = callFunction<{ phoneNumber: string }, { success: boolean; message: string }>('sendTestSms');
      const result = await sendTestSms({ phoneNumber: testPhone.trim() });
      toast.success(result.data.message || `SMS de test envoyé au ${testPhone}`);
    } catch (err: any) {
      const msg = err?.message || 'Échec de l\'envoi du SMS de test';
      toast.error(msg);
      console.error('Test SMS error:', err);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configuration SMS" description="Orange SMS API">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuration SMS" description="Gérez les credentials de l'API Orange SMS">
      <div className="max-w-3xl space-y-6">
        {/* Status Banner */}
        <Card className={configured && enabled ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}>
          <CardContent className="flex items-center gap-4 py-4">
            {configured && enabled ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Orange SMS configuré et actif</p>
                  <p className="text-sm text-muted-foreground">
                    {lastUpdated ? `Dernière mise à jour : ${lastUpdated.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Les SMS seront envoyés automatiquement'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    {configured ? 'Orange SMS désactivé' : 'Orange SMS non configuré'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {configured ? 'Activez le service pour envoyer des SMS' : 'Renseignez vos credentials Orange Developer pour activer les SMS'}
                  </p>
                </div>
              </>
            )}
            <div className="ml-auto">
              <Badge variant={configured && enabled ? 'default' : 'secondary'}>
                {configured && enabled ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Credentials API Orange
            </CardTitle>
            <CardDescription>
              Obtenez vos credentials sur{' '}
              <a 
                href="https://developer.orange.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                developer.orange.com
              </a>
              {' '}→ My Apps → Votre application SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="Votre Client ID Orange Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  placeholder="Votre Client Secret"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderAddress">Numéro expéditeur</Label>
              <Input
                id="senderAddress"
                value={senderAddress}
                onChange={e => setSenderAddress(e.target.value)}
                placeholder="tel:+224XXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Format : tel:+224XXXXXXXXX (numéro autorisé par Orange)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderName">Nom de l'expéditeur</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="GuineeGo"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Service SMS actif</p>
                <p className="text-sm text-muted-foreground">
                  Activer/désactiver l'envoi automatique de SMS
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test SMS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Tester l'envoi SMS
            </CardTitle>
            <CardDescription>
              Envoyez un SMS de test pour vérifier la configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="testPhone">Numéro de test</Label>
                <Input
                  id="testPhone"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="621XXXXXX"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || !configured}
                >
                  {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Envoyer test
                </Button>
              </div>
            </div>
            {!configured && (
              <p className="text-sm text-muted-foreground">
                Enregistrez d'abord les credentials pour pouvoir tester
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
