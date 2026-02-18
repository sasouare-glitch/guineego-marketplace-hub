/**
 * useSecurity – Hook pour la gestion de la sécurité
 *
 * - Sessions actives : issues des documents Firestore `users`
 *   (champ metadata.lastLoginAt + metadata.lastDevice)
 * - Journal d'audit : collection Firestore `audit_logs`
 *   (créé automatiquement lors des actions sensibles)
 * - Matrice des rôles : comptage en temps réel par rôle
 */

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string;           // uid
  email: string;
  displayName?: string;
  role: string;
  lastActive: Timestamp | null;
  lastDevice?: string;
  lastIp?: string;
  current: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  uid?: string;
  user: string;         // email ou 'inconnu'
  role: string;
  ip?: string;
  details: string;
  severity: 'info' | 'warn' | 'error';
  createdAt: Timestamp | null;
}

export interface RoleStat {
  role: string;
  label: string;
  count: number;
  permissions: string[];
  color: string;
  bg: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; permissions: string[]; color: string; bg: string }> = {
  admin:       { label: 'Administrateur', permissions: ['Toutes'],                                color: 'text-red-600',          bg: 'bg-red-500/10' },
  seller:      { label: 'Vendeur',         permissions: ['Produits', 'Commandes', 'Finances'],    color: 'text-primary',           bg: 'bg-primary/10' },
  courier:     { label: 'Livreur',         permissions: ['Missions', 'Carte', 'Gains'],           color: 'text-orange-600',        bg: 'bg-orange-500/10' },
  transitaire: { label: 'Transitaire',     permissions: ['Expéditions', 'Devis', 'Factures'],    color: 'text-blue-600',          bg: 'bg-blue-500/10' },
  investor:    { label: 'Investisseur',    permissions: ['Portefeuille', 'Opportunités'],         color: 'text-purple-600',        bg: 'bg-purple-500/10' },
  closer:      { label: 'Closer',          permissions: ['Tâches', 'Performances'],               color: 'text-yellow-600',        bg: 'bg-yellow-500/10' },
  customer:    { label: 'Client',          permissions: ['Marketplace', 'Commandes', 'Profil'],  color: 'text-muted-foreground',  bg: 'bg-muted' },
};

// Seuil de "session active" : connecté dans les 24 dernières heures
const ACTIVE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSecurity() {
  const { user } = useAuth();

  const [sessions, setSessions]     = useState<ActiveSession[]>([]);
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>([]);
  const [roleStats, setRoleStats]   = useState<RoleStat[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAudit, setLoadingAudit]       = useState(true);

  // ── Sessions actives ─────────────────────────────────────────────────────
  useEffect(() => {
    const cutoff = Timestamp.fromMillis(Date.now() - ACTIVE_THRESHOLD_MS);

    const q = query(
      collection(db, 'users'),
      where('metadata.lastLoginAt', '>=', cutoff),
      orderBy('metadata.lastLoginAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      // Comptage par rôle
      const roleCounts: Record<string, number> = {};
      const totalSnap = snap.docs.length;

      const mapped: ActiveSession[] = snap.docs.map(d => {
        const data = d.data();
        const role = data.role ?? 'customer';
        roleCounts[role] = (roleCounts[role] ?? 0) + 1;

        return {
          id: d.id,
          email: data.email ?? data.phone ?? '—',
          displayName: data.displayName,
          role,
          lastActive: data.metadata?.lastLoginAt ?? null,
          lastDevice: data.metadata?.lastDevice ?? undefined,
          lastIp: data.metadata?.lastIp ?? undefined,
          current: d.id === user?.uid,
        };
      });

      setSessions(mapped);

      // Construire la matrice des rôles depuis les comptes actifs +
      // récupérer le total complet
      getDocs(collection(db, 'users')).then(all => {
        const allRoleCounts: Record<string, number> = {};
        all.docs.forEach(d => {
          const r = d.data().role ?? 'customer';
          allRoleCounts[r] = (allRoleCounts[r] ?? 0) + 1;
        });

        const stats: RoleStat[] = Object.entries(ROLE_META).map(([role, meta]) => ({
          role,
          ...meta,
          count: allRoleCounts[role] ?? 0,
        }));

        setRoleStats(stats);
        setTotalUsers(all.size);
      }).catch(() => {
        // Fallback si pas de permission full-collection
        const stats: RoleStat[] = Object.entries(ROLE_META).map(([role, meta]) => ({
          role,
          ...meta,
          count: roleCounts[role] ?? 0,
        }));
        setRoleStats(stats);
        setTotalUsers(totalSnap);
      });

      setLoadingSessions(false);
    }, (err) => {
      console.error('useSecurity sessions error:', err);
      setLoadingSessions(false);
    });

    return () => unsub();
  }, [user?.uid]);

  // ── Journal d'audit ───────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const logs: AuditLog[] = snap.docs.map(d => ({
        id: d.id,
        action: d.data().action ?? 'unknown',
        uid: d.data().uid,
        user: d.data().user ?? d.data().email ?? 'inconnu',
        role: d.data().role ?? '—',
        ip: d.data().ip,
        details: d.data().details ?? '',
        severity: d.data().severity ?? 'info',
        createdAt: d.data().createdAt ?? null,
      }));
      setAuditLogs(logs);
      setLoadingAudit(false);
    }, (err) => {
      console.error('useSecurity audit error:', err);
      setLoadingAudit(false);
    });

    return () => unsub();
  }, []);

  // ── Écriture d'un événement d'audit ──────────────────────────────────────
  const logAuditEvent = useCallback(async (params: {
    action: string;
    details: string;
    severity?: 'info' | 'warn' | 'error';
    targetUid?: string;
    targetUser?: string;
    targetRole?: string;
  }) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action: params.action,
        uid: user.uid,
        user: user.email ?? user.uid,
        role: 'admin',
        targetUid: params.targetUid,
        targetUser: params.targetUser,
        targetRole: params.targetRole,
        details: params.details,
        severity: params.severity ?? 'info',
        createdAt: serverTimestamp(),
        platform: 'web-admin',
      });
    } catch (err) {
      console.error('logAuditEvent error:', err);
    }
  }, [user]);

  // ── Journalisation automatique de la visite admin ─────────────────────────
  useEffect(() => {
    if (!user) return;
    logAuditEvent({
      action: 'admin_page_visit',
      details: 'Consultation du tableau de bord sécurité',
      severity: 'info',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return {
    sessions,
    auditLogs,
    roleStats,
    totalUsers,
    loadingSessions,
    loadingAudit,
    logAuditEvent,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formate un Timestamp Firestore en texte relatif "il y a X"
 */
export function formatRelativeTime(ts: Timestamp | null): string {
  if (!ts) return '—';
  const diff = Date.now() - ts.toMillis();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

/**
 * Extrait le nom de l'appareil depuis le User-Agent (si stocké)
 */
export function parseDevice(ua?: string): string {
  if (!ua) return 'Navigateur inconnu';
  if (/iPhone|iPad/.test(ua)) return 'Safari / iPhone';
  if (/Android/.test(ua)) return 'Chrome / Android';
  if (/Windows/.test(ua)) return 'Chrome / Windows';
  if (/Mac/.test(ua)) return 'Safari / Mac';
  if (/Linux/.test(ua)) return 'Firefox / Linux';
  return ua.slice(0, 40);
}
