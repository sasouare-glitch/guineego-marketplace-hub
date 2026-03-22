/**
 * Admin SMS & WhatsApp Configuration Page
 * Orange SMS + Twilio WhatsApp fallback config stored in Firestore
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
import { Save, Loader2, Eye, EyeOff, Send, CheckCircle2, XCircle, MessageSquare, Phone, WifiOff, AlertTriangle } from 'lucide-react';
import { OrangeSmsDiagnosticPanel } from '@/components/admin/OrangeSmsDiagnosticPanel';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';
import { toast } from 'sonner';

/**
 * Classify Cloud Function errors into user-friendly messages
 */
function getCloudFunctionErrorMessage(err: any, functionName: string, channel: string): string {
  const code = err?.code || '';
  const message = err?.message || '';
  const details = err?.details || '';

  // Network error — function not reachable (not deployed, CORS, offline)
  if (
    code === 'functions/internal' && (!message || message === 'INTERNAL') ||
    message?.includes('Failed to fetch') ||
    message?.includes('NetworkError') ||
    message?.includes('Network request failed') ||
    message?.includes('ERR_CONNECTION') ||
    err instanceof TypeError
  ) {
    return `🔌 Impossible de joindre la fonction "${functionName}". Vérifiez qu'elle est bien déployée sur Firebase (firebase deploy --only functions:${functionName}).`;
  }

  // Unauthenticated
  if (code === 'functions/unauthenticated' || code === 'unauthenticated') {
    return `🔒 Authentification requise. Reconnectez-vous et réessayez.`;
  }

  // Permission denied
  if (code === 'functions/permission-denied' || code === 'permission-denied') {
    return `⛔ Accès refusé. Seuls les administrateurs peuvent envoyer un ${channel} de test.`;
  }

  // Precondition failed (missing config)
  if (code === 'functions/failed-precondition' || code === 'failed-precondition') {
    return `⚙️ Configuration ${channel} incomplète côté serveur : ${message || details || 'credentials manquants'}`;
  }

  // Invalid argument
  if (code === 'functions/invalid-argument' || code === 'invalid-argument') {
    return `📋 Paramètre invalide : ${message || 'vérifiez le numéro de téléphone'}`;
  }

  // Internal server error (API call failed on the function side)
  if (code === 'functions/internal' || code === 'internal') {
    return `❌ Erreur serveur ${channel} : ${message || details || 'erreur interne de la Cloud Function. Consultez les logs Firebase pour plus de détails.'}`;
  }

  // Fallback
  return `❌ Échec de l'envoi ${channel} : ${message || 'erreur inconnue'}`;
}

// ─── Orange SMS Config Section ───────────────────────────────────────────────

function OrangeSmsConfigSection() {
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

  useEffect(() => { loadConfig(); }, []);

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
        if (data.updatedAt?.toDate) setLastUpdated(data.updatedAt.toDate());
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
      const errorMsg = getCloudFunctionErrorMessage(err, 'sendTestSms', 'SMS');
      toast.error(errorMsg, { duration: 8000 });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
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
            <a href="https://developer.orange.com" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
              developer.orange.com
            </a>
            {' '}→ My Apps → Votre application SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input id="clientId" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Votre Client ID Orange Developer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <div className="relative">
              <Input id="clientSecret" type={showSecret ? 'text' : 'password'} value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Votre Client Secret" className="pr-10" />
              <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderAddress">Numéro expéditeur</Label>
            <Input id="senderAddress" value={senderAddress} onChange={e => setSenderAddress(e.target.value)} placeholder="tel:+224XXXXXXXXX" />
            <p className="text-xs text-muted-foreground">Format : tel:+224XXXXXXXXX (numéro autorisé par Orange)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderName">Nom de l'expéditeur</Label>
            <Input id="senderName" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="GuineeGo" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Service SMS actif</p>
              <p className="text-sm text-muted-foreground">Activer/désactiver l'envoi automatique de SMS</p>
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
          <CardDescription>Envoyez un SMS de test pour vérifier la configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="testPhone">Numéro de test</Label>
              <Input id="testPhone" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="621XXXXXX" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleTest} disabled={testing || !configured}>
                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Envoyer test
              </Button>
            </div>
          </div>
          {!configured && (
            <p className="text-sm text-muted-foreground">Enregistrez d'abord les credentials pour pouvoir tester</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Twilio WhatsApp Config Section ──────────────────────────────────────────

function TwilioWhatsAppConfigSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [configured, setConfigured] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'twilio_whatsapp'));
      if (snap.exists()) {
        const data = snap.data();
        setAccountSid(data.accountSid || '');
        setAuthToken(data.authToken || '');
        setFromNumber(data.fromNumber || '');
        setEnabled(data.enabled !== false);
        setConfigured(!!(data.accountSid && data.authToken && data.fromNumber));
        if (data.updatedAt?.toDate) setLastUpdated(data.updatedAt.toDate());
      }
    } catch (err) {
      console.error('Error loading Twilio config:', err);
      toast.error('Erreur lors du chargement de la configuration Twilio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accountSid.trim() || !authToken.trim() || !fromNumber.trim()) {
      toast.error('Account SID, Auth Token et numéro WhatsApp sont requis');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'twilio_whatsapp'), {
        accountSid: accountSid.trim(),
        authToken: authToken.trim(),
        fromNumber: fromNumber.trim(),
        enabled,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setConfigured(true);
      setLastUpdated(new Date());
      toast.success('Configuration Twilio WhatsApp enregistrée');
    } catch (err) {
      console.error('Error saving Twilio config:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      toast.error('Entrez un numéro de test');
      return;
    }
    setTesting(true);
    try {
      const sendTest = callFunction<{ phoneNumber: string }, { success: boolean; message: string }>('sendTestWhatsApp');
      const result = await sendTest({ phoneNumber: testPhone.trim() });
      toast.success(result.data.message || `WhatsApp de test envoyé au ${testPhone}`);
    } catch (err: any) {
      const errorMsg = getCloudFunctionErrorMessage(err, 'sendTestWhatsApp', 'WhatsApp');
      toast.error(errorMsg, { duration: 8000 });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Status Banner */}
      <Card className={configured && enabled ? 'border-primary/30 bg-primary/5' : 'border-muted'}>
        <CardContent className="flex items-center gap-4 py-4">
          {configured && enabled ? (
            <>
              <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Twilio WhatsApp configuré et actif</p>
                <p className="text-sm text-muted-foreground">
                  {lastUpdated ? `Dernière mise à jour : ${lastUpdated.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Fallback WhatsApp actif en cas d\'échec SMS'}
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-8 h-8 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  {configured ? 'WhatsApp désactivé' : 'Twilio WhatsApp non configuré'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {configured ? 'Activez pour utiliser WhatsApp comme fallback' : 'Renseignez vos credentials Twilio pour activer le fallback WhatsApp'}
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
            Credentials Twilio WhatsApp
          </CardTitle>
          <CardDescription>
            Obtenez vos credentials sur{' '}
            <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
              console.twilio.com
            </a>
            {' '}→ Account Info. Activez WhatsApp dans Messaging → Try WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tw-accountSid">Account SID</Label>
            <Input id="tw-accountSid" value={accountSid} onChange={e => setAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tw-authToken">Auth Token</Label>
            <div className="relative">
              <Input id="tw-authToken" type={showToken ? 'text' : 'password'} value={authToken} onChange={e => setAuthToken(e.target.value)} placeholder="Votre Auth Token Twilio" className="pr-10 font-mono" />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tw-fromNumber">Numéro WhatsApp expéditeur</Label>
            <Input id="tw-fromNumber" value={fromNumber} onChange={e => setFromNumber(e.target.value)} placeholder="whatsapp:+14155238886" className="font-mono" />
            <p className="text-xs text-muted-foreground">Format : whatsapp:+XXXXXXXXXXX (numéro sandbox ou approuvé Twilio)</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Fallback WhatsApp actif</p>
              <p className="text-sm text-muted-foreground">Envoyer un WhatsApp si le SMS Orange échoue</p>
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

      {/* Test WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Tester l'envoi WhatsApp
          </CardTitle>
          <CardDescription>
            Envoyez un message WhatsApp de test pour vérifier la configuration Twilio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="tw-testPhone">Numéro guinéen de test</Label>
              <Input
                id="tw-testPhone"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="621XXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Le destinataire doit avoir rejoint le sandbox Twilio WhatsApp au préalable
              </p>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleTestWhatsApp}
                disabled={testing || !configured}
              >
                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Envoyer test
              </Button>
            </div>
          </div>
          {!configured && (
            <p className="text-sm text-muted-foreground">Enregistrez d'abord les credentials pour pouvoir tester</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminSmsConfigPage() {
  return (
    <AdminLayout title="Configuration SMS & WhatsApp" description="Gérez les canaux de notification : Orange SMS (principal) et Twilio WhatsApp (fallback)">
      <div className="max-w-3xl space-y-8">
        {/* Orange SMS Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            📱 Canal principal — Orange SMS
          </h2>
          <div className="space-y-6">
            <OrangeSmsConfigSection />
            <OrangeSmsDiagnosticPanel />
          </div>
        </div>

        <Separator className="my-2" />

        {/* Twilio WhatsApp Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            💬 Canal fallback — Twilio WhatsApp
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Si l'envoi SMS Orange échoue, un message WhatsApp sera automatiquement envoyé via Twilio.
          </p>
          <div className="space-y-6">
            <TwilioWhatsAppConfigSection />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}