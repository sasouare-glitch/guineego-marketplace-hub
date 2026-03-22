/**
 * Orange SMS Diagnostic Panel
 * Runs live checks: OAuth token, SMS bundle/contract, sender validation
 * Displays clear, actionable results for each check.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, Stethoscope, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  ShieldCheck, Package, KeyRound, Send as SendIcon
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type CheckStatus = 'idle' | 'running' | 'pass' | 'warn' | 'fail';

interface DiagnosticCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail: string;
}

const ORANGE_OAUTH_URL = 'https://api.orange.com/oauth/v3/token';
const ORANGE_CONTRACTS_URL = 'https://api.orange.com/sms/admin/v1/contracts';

const INITIAL_CHECKS: DiagnosticCheck[] = [
  {
    id: 'credentials',
    label: 'Credentials Firestore',
    description: 'Vérifie que Client ID et Client Secret sont renseignés dans config/orange_sms',
    status: 'idle',
    detail: '',
  },
  {
    id: 'oauth',
    label: 'Authentification OAuth',
    description: "Teste l'obtention d'un token via api.orange.com/oauth/v3/token",
    status: 'idle',
    detail: '',
  },
  {
    id: 'bundle',
    label: 'Bundle SMS (contrat)',
    description: 'Vérifie que le contrat SMS Guinée est actif et que le solde est positif',
    status: 'idle',
    detail: '',
  },
  {
    id: 'sender',
    label: 'Sender Address',
    description: 'Vérifie le format du numéro expéditeur (tel:+224XXXX)',
    status: 'idle',
    detail: '',
  },
];

const CHECK_ICONS: Record<string, React.ReactNode> = {
  credentials: <KeyRound className="w-5 h-5" />,
  oauth: <ShieldCheck className="w-5 h-5" />,
  bundle: <Package className="w-5 h-5" />,
  sender: <SendIcon className="w-5 h-5" />,
};

export function OrangeSmsDiagnosticPanel() {
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<DiagnosticCheck[]>(INITIAL_CHECKS);

  const updateCheck = (id: string, update: Partial<DiagnosticCheck>) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, ...update } : c));
  };

  const runDiagnostic = async () => {
    setRunning(true);
    setChecks(INITIAL_CHECKS.map(c => ({ ...c, status: 'running' as CheckStatus, detail: '' })));

    // 1. Check Firestore credentials
    let clientId = '';
    let clientSecret = '';
    let senderAddress = '';
    let enabled = false;

    try {
      const snap = await getDoc(doc(db, 'config', 'orange_sms'));
      if (!snap.exists()) {
        updateCheck('credentials', { status: 'fail', detail: "Document config/orange_sms introuvable dans Firestore. Enregistrez d'abord vos credentials." });
        updateCheck('oauth', { status: 'fail', detail: 'Impossible sans credentials.' });
        updateCheck('bundle', { status: 'fail', detail: 'Impossible sans credentials.' });
        updateCheck('sender', { status: 'fail', detail: 'Aucune config trouvée.' });
        setRunning(false);
        return;
      }

      const data = snap.data();
      clientId = data.clientId || '';
      clientSecret = data.clientSecret || '';
      senderAddress = data.senderAddress || '';
      enabled = data.enabled !== false;

      if (!clientId || !clientSecret) {
        updateCheck('credentials', {
          status: 'fail',
          detail: `${!clientId ? 'Client ID manquant. ' : ''}${!clientSecret ? 'Client Secret manquant.' : ''} Renseignez-les dans la section Credentials ci-dessus.`,
        });
        updateCheck('oauth', { status: 'fail', detail: 'Credentials incomplets.' });
        updateCheck('bundle', { status: 'fail', detail: 'Credentials incomplets.' });
      } else if (!enabled) {
        updateCheck('credentials', {
          status: 'warn',
          detail: `Credentials présents (ID: ${clientId.slice(0, 8)}…) mais le service est DÉSACTIVÉ.`,
        });
      } else {
        updateCheck('credentials', {
          status: 'pass',
          detail: `Client ID: ${clientId.slice(0, 8)}… | Secret: ****${clientSecret.slice(-4)} | Service: actif`,
        });
      }
    } catch (err: any) {
      updateCheck('credentials', { status: 'fail', detail: `Erreur lecture Firestore: ${err.message}` });
      updateCheck('oauth', { status: 'fail', detail: 'Lecture Firestore échouée.' });
      updateCheck('bundle', { status: 'fail', detail: 'Lecture Firestore échouée.' });
      updateCheck('sender', { status: 'fail', detail: 'Lecture Firestore échouée.' });
      setRunning(false);
      return;
    }

    // 2. Check sender format
    if (!senderAddress) {
      updateCheck('sender', {
        status: 'warn',
        detail: 'Aucun numéro expéditeur configuré. Le système utilisera la valeur par défaut (tel:+2240000). Recommandé pour la Guinée : tel:+2240000.',
      });
    } else if (!/^tel:\+224\d{4,}$/.test(senderAddress)) {
      updateCheck('sender', {
        status: 'fail',
        detail: `Format invalide : "${senderAddress}". Format attendu : tel:+224XXXX (ex: tel:+2240000 pour Guinée Conakry).`,
      });
    } else {
      updateCheck('sender', { status: 'pass', detail: `Sender address : ${senderAddress} ✓` });
    }

    if (!clientId || !clientSecret) {
      setRunning(false);
      return;
    }

    // 3. Test OAuth token
    let accessToken = '';
    try {
      updateCheck('oauth', { status: 'running', detail: 'Connexion à api.orange.com…' });

      const credentials = btoa(`${clientId}:${clientSecret}`);
      const response = await fetch(ORANGE_OAUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: 'grant_type=client_credentials',
      });

      const body = await response.text();
      let parsed: any = {};
      try { parsed = JSON.parse(body); } catch { /* noop */ }

      if (!response.ok) {
        let errorDetail = '';
        if (response.status === 401) {
          errorDetail = '🔑 Credentials invalides. Vérifiez que le Client ID et Client Secret correspondent à ceux de votre app sur developer.orange.com → MyApps → Credentials.';
        } else if (response.status === 403) {
          errorDetail = "⛔ Accès refusé. Votre application n'est peut-être pas activée ou n'a pas souscrit à l'API SMS Guinea Conakry.";
        } else if (response.status === 429) {
          errorDetail = '⏳ Trop de requêtes de token (limite : 50/min). Réessayez dans quelques minutes.';
        } else {
          errorDetail = `Erreur ${response.status}: ${parsed.error_description || parsed.message || body}`;
        }
        updateCheck('oauth', { status: 'fail', detail: errorDetail });
        updateCheck('bundle', { status: 'fail', detail: 'Impossible sans token OAuth valide.' });
        setRunning(false);
        return;
      }

      accessToken = parsed.access_token || '';
      if (!accessToken) {
        updateCheck('oauth', { status: 'fail', detail: 'Réponse OAuth reçue mais access_token absent. Contactez le support Orange.' });
        updateCheck('bundle', { status: 'fail', detail: 'Token manquant.' });
        setRunning(false);
        return;
      }

      const scopes = parsed.scope || '';
      updateCheck('oauth', {
        status: 'pass',
        detail: `Token obtenu ✓ | Expire dans ${parsed.expires_in || '?'}s${scopes ? ` | Scopes: ${scopes}` : ''}`,
      });
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err instanceof TypeError) {
        updateCheck('oauth', {
          status: 'warn',
          detail: "⚠️ Test OAuth bloqué par CORS (normal depuis un navigateur). Les Cloud Functions ne sont pas affectées. Utilisez le bouton « Envoyer test » ci-dessus pour un test complet.",
        });
        updateCheck('bundle', {
          status: 'warn',
          detail: '⚠️ Test du contrat impossible depuis le navigateur (CORS). Utilisez le test SMS pour valider.',
        });
        setRunning(false);
        return;
      }
      updateCheck('oauth', { status: 'fail', detail: `Erreur réseau : ${err.message}` });
      updateCheck('bundle', { status: 'fail', detail: 'Token non obtenu.' });
      setRunning(false);
      return;
    }

    // 4. Check SMS contracts/bundle
    try {
      updateCheck('bundle', { status: 'running', detail: 'Vérification du contrat SMS…' });

      const contractRes = await fetch(`${ORANGE_CONTRACTS_URL}?country=GIN`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });

      const contractBody = await contractRes.text();
      let contracts: any[] = [];
      try { contracts = JSON.parse(contractBody); } catch { /* noop */ }

      if (!contractRes.ok) {
        updateCheck('bundle', {
          status: 'fail',
          detail: contractRes.status === 401
            ? 'Token expiré ou invalide pour consulter les contrats. Réessayez.'
            : `Erreur ${contractRes.status}: ${contractBody.slice(0, 200)}`,
        });
        setRunning(false);
        return;
      }

      if (!Array.isArray(contracts) || contracts.length === 0) {
        updateCheck('bundle', {
          status: 'fail',
          detail: 'Aucun contrat SMS trouvé pour la Guinée (GIN). Achetez un bundle SMS sur developer.orange.com → Pricing.',
        });
        setRunning(false);
        return;
      }

      const activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE');
      if (activeContracts.length === 0) {
        const expired = contracts[0];
        updateCheck('bundle', {
          status: 'fail',
          detail: `Bundle expiré ! Statut: ${expired.status} | Expiration: ${expired.expirationDate || 'N/A'} | Unités restantes: ${expired.availableUnits ?? '?'}. Achetez un nouveau bundle.`,
        });
        setRunning(false);
        return;
      }

      const contract = activeContracts[0];
      const units = contract.availableUnits ?? 0;
      const expDate = contract.expirationDate
        ? new Date(contract.expirationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'N/A';

      if (units <= 0) {
        updateCheck('bundle', {
          status: 'fail',
          detail: `Solde SMS épuisé ! 0 unité restante. Contrat actif jusqu'au ${expDate}. Rechargez votre bundle sur developer.orange.com.`,
        });
      } else if (units < 10) {
        updateCheck('bundle', {
          status: 'warn',
          detail: `⚠️ Solde faible : ${units} SMS restants | Expire le ${expDate}. Pensez à recharger.`,
        });
      } else {
        updateCheck('bundle', {
          status: 'pass',
          detail: `${units} SMS disponibles | Expire le ${expDate} | Type: ${contract.offerName || contract.type || 'N/A'}`,
        });
      }
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err instanceof TypeError) {
        updateCheck('bundle', {
          status: 'warn',
          detail: '⚠️ Vérification du contrat bloquée par CORS. Utilisez le test SMS pour valider.',
        });
      } else {
        updateCheck('bundle', { status: 'fail', detail: `Erreur : ${err.message}` });
      }
    }

    setRunning(false);
  };

  const statusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warn': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const statusBadge = (status: CheckStatus) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">OK</Badge>;
      case 'fail': return <Badge variant="destructive">Erreur</Badge>;
      case 'warn': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Attention</Badge>;
      case 'running': return <Badge variant="secondary">En cours…</Badge>;
      default: return <Badge variant="outline">Non testé</Badge>;
    }
  };

  const hasResults = checks.some(c => c.status !== 'idle');
  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Diagnostic Orange SMS</CardTitle>
              <CardDescription>Vérifiez la configuration complète en un clic</CardDescription>
            </div>
          </div>
          <Button onClick={runDiagnostic} disabled={running} variant={hasResults ? 'outline' : 'default'} size="sm">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {hasResults ? 'Relancer' : 'Lancer le diagnostic'}
          </Button>
        </div>

        {hasResults && !running && (
          <div className="flex gap-3 mt-3">
            {passCount > 0 && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {passCount} OK
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-sm text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {warnCount} attention
              </span>
            )}
            {failCount > 0 && (
              <span className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {failCount} erreur{failCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      {hasResults && (
        <CardContent className="space-y-1 pt-0">
          <Separator className="mb-4" />
          {checks.map((check, i) => (
            <div key={check.id}>
              <div className="flex items-start gap-3 py-3">
                <div className="mt-0.5 shrink-0">{statusIcon(check.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground">{check.label}</span>
                    {statusBadge(check.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{check.description}</p>
                  {check.detail && (
                    <div className={`text-xs rounded-md px-3 py-2 mt-1 font-mono leading-relaxed whitespace-pre-wrap ${
                      check.status === 'pass'
                        ? 'bg-green-500/5 text-green-700 dark:text-green-400'
                        : check.status === 'fail'
                          ? 'bg-destructive/5 text-destructive'
                          : check.status === 'warn'
                            ? 'bg-yellow-500/5 text-yellow-700 dark:text-yellow-400'
                            : 'bg-muted text-muted-foreground'
                    }`}>
                      {check.detail}
                    </div>
                  )}
                </div>
              </div>
              {i < checks.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}