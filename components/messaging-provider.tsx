"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type MessagingContextValue = {
  open: boolean;
  expanded: boolean;
  conversationId: string | null;
  pendingPeerUserId: string | null;
  openMessaging: (conversationId?: string | null) => void;
  openMessagingWithPeer: (peerUserId: string) => void;
  clearPendingPeer: () => void;
  closeMessaging: () => void;
  toggleMessaging: () => void;
  setExpanded: (expanded: boolean) => void;
  openConversation: (conversationId: string) => void;
  closeConversation: () => void;
};

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within MessagingProvider");
  }
  return context;
}

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpandedState] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingPeerUserId, setPendingPeerUserId] = useState<string | null>(
    null,
  );

  const setExpanded = useCallback((next: boolean) => {
    setExpandedState(next);
    if (!next) {
      setConversationId(null);
      setPendingPeerUserId(null);
    }
  }, []);

  const openMessaging = useCallback((nextConversationId?: string | null) => {
    setExpandedState(true);
    setPendingPeerUserId(null);
    if (nextConversationId !== undefined) {
      setConversationId(nextConversationId);
    }
  }, []);

  const openMessagingWithPeer = useCallback((peerUserId: string) => {
    setExpandedState(true);
    setConversationId(null);
    setPendingPeerUserId(peerUserId);
  }, []);

  const clearPendingPeer = useCallback(() => {
    setPendingPeerUserId(null);
  }, []);

  const closeMessaging = useCallback(() => {
    setExpandedState(false);
    setConversationId(null);
    setPendingPeerUserId(null);
  }, []);

  const toggleMessaging = useCallback(() => {
    setExpandedState((current) => {
      if (current) {
        setConversationId(null);
        setPendingPeerUserId(null);
        return false;
      }
      return true;
    });
  }, []);

  const openConversation = useCallback((id: string) => {
    setExpandedState(true);
    setPendingPeerUserId(null);
    setConversationId(id);
  }, []);

  const closeConversation = useCallback(() => {
    setConversationId(null);
  }, []);

  const value = useMemo(
    () => ({
      open: expanded,
      expanded,
      conversationId,
      pendingPeerUserId,
      openMessaging,
      openMessagingWithPeer,
      clearPendingPeer,
      closeMessaging,
      toggleMessaging,
      setExpanded,
      openConversation,
      closeConversation,
    }),
    [
      expanded,
      conversationId,
      pendingPeerUserId,
      openMessaging,
      openMessagingWithPeer,
      clearPendingPeer,
      closeMessaging,
      toggleMessaging,
      setExpanded,
      openConversation,
      closeConversation,
    ],
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}
