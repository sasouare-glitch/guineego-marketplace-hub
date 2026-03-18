/**
 * Seller Messages Hook
 * Real-time Firestore messaging between sellers and customers
 * 
 * Firestore structure:
 * - conversations/{id} → { participants: [sellerId, customerId], sellerName, customerName, lastMessage, lastMessageAt, unreadBySeller, unreadByCustomer }
 * - conversations/{id}/messages/{msgId} → { text, senderId, senderRole, createdAt, read }
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// TYPES
// ============================================

export interface ConversationDoc {
  id: string;
  participants: string[];
  sellerId: string;
  customerId: string;
  customerName: string;
  customerInitials: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  unreadBySeller: number;
  unreadByCustomer: number;
  customerOnline?: boolean;
  createdAt: Timestamp;
}

export interface MessageDoc {
  id: string;
  text: string;
  senderId: string;
  senderRole: 'seller' | 'customer';
  read: boolean;
  createdAt: Timestamp;
}

// ============================================
// HOOK
// ============================================

export function useSellerMessages() {
  const { user } = useAuth();
  const sellerId = user?.uid;

  const [conversations, setConversations] = useState<ConversationDoc[]>([]);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // ---- Subscribe to seller's conversations ----
  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('sellerId', '==', sellerId),
      orderBy('lastMessageAt', 'desc')
    );

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const convs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ConversationDoc[];
          setConversations(convs);
          setLoading(false);
        },
        (err) => {
          console.error('Conversations listener error:', err);
          setLoading(false);
        }
      );
    } catch (e) {
      console.error('SellerMessages: Failed to attach conversations listener:', e);
      setLoading(false);
    }

    return () => { try { unsubscribe?.(); } catch (e) { /* ignore */ } };
  }, [sellerId]);

  // ---- Subscribe to messages of selected conversation ----
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    const q = query(
      collection(db, 'conversations', selectedConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as MessageDoc[];
          setMessages(msgs);
          setMessagesLoading(false);
        },
        (err) => {
          console.error('Messages listener error:', err);
          setMessagesLoading(false);
        }
      );
    } catch (e) {
      console.error('SellerMessages: Failed to attach messages listener:', e);
      setMessagesLoading(false);
    }

    return () => { try { unsubscribe?.(); } catch (e) { /* ignore */ } };
  }, [selectedConversationId]);

  // ---- Select conversation & mark as read ----
  const selectConversation = useCallback(
    async (conversationId: string) => {
      setSelectedConversationId(conversationId);

      // Reset unread count for seller
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, { unreadBySeller: 0 }).catch(console.error);

      // Mark unread messages as read
      const unreadQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('senderRole', '==', 'customer'),
        where('read', '==', false)
      );
      const unreadSnap = await getDocs(unreadQuery);
      if (!unreadSnap.empty) {
        const batch = writeBatch(db);
        unreadSnap.docs.forEach((d) => batch.update(d.ref, { read: true }));
        await batch.commit().catch(console.error);
      }
    },
    []
  );

  // ---- Send message ----
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedConversationId || !sellerId) return;

      const convRef = doc(db, 'conversations', selectedConversationId);
      const messagesRef = collection(db, 'conversations', selectedConversationId, 'messages');

      // Add message
      await addDoc(messagesRef, {
        text: text.trim(),
        senderId: sellerId,
        senderRole: 'seller',
        read: false,
        createdAt: serverTimestamp(),
      });

      // Update conversation metadata
      const conv = conversations.find((c) => c.id === selectedConversationId);
      await updateDoc(convRef, {
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
        unreadByCustomer: (conv?.unreadByCustomer || 0) + 1,
      });
    },
    [selectedConversationId, sellerId, conversations]
  );

  // ---- Computed values ----
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadBySeller || 0), 0);
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  return {
    conversations,
    messages,
    selectedConversation,
    selectedConversationId,
    loading,
    messagesLoading,
    totalUnread,
    selectConversation,
    sendMessage,
    setSelectedConversationId,
  };
}
