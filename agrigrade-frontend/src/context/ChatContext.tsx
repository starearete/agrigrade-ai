import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';
import { Conversation, ChatMessage } from '../types/chat';

interface ChatContextType {
  isConnected: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  messagesByConversation: Record<number, ChatMessage[]>;
  unreadCount: number;
  isOtherTyping: boolean;
  typingUser: string | null;
  selectConversation: (conversationId: number | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendTyping: (typing: boolean) => void;
  refreshConversations: () => Promise<void>;
  deleteConversation: (conversationId: number) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  hasMoreOlderMessages: boolean;
  isLoadingOlder: boolean;
  updatePurchaseRequestStatus: (requestId: number, newStatus: 'ACCEPTED' | 'DECLINED' | 'REJECTED', reason?: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper function to deduplicate and sort messages chronologically
export function deduplicateAndSortMessages(
  existingMessages: ChatMessage[],
  incomingMessages: ChatMessage[]
): ChatMessage[] {
  const messageMap = new Map<string, ChatMessage>();

  const getPrimaryKeys = (m: ChatMessage): string[] => {
    const keys: string[] = [];
    if (m.clientMessageId && m.clientMessageId.trim() !== '') {
      keys.push(`client_${m.clientMessageId.trim()}`);
    }
    if (m.messagePublicId && m.messagePublicId.trim() !== '') {
      keys.push(`pub_${m.messagePublicId.trim()}`);
    }
    if (m.id && typeof m.id === 'number' && m.id < 100000000000) {
      keys.push(`db_${m.id}`);
    }
    return keys;
  };

  const processMessage = (m: ChatMessage) => {
    const keys = getPrimaryKeys(m);
    let matchedKey: string | null = null;

    for (const key of keys) {
      if (messageMap.has(key)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      const existing = messageMap.get(matchedKey)!;
      const merged: ChatMessage = {
        ...existing,
        ...m,
        id: (m.id && typeof m.id === 'number' && m.id < 100000000000) ? m.id : existing.id,
        status: m.status || existing.status,
        sentAt: m.sentAt || existing.sentAt,
        deliveredAt: m.deliveredAt || existing.deliveredAt,
        readAt: m.readAt || existing.readAt,
        purchaseRequestDetails: m.purchaseRequestDetails || existing.purchaseRequestDetails,
      };

      for (const k of getPrimaryKeys(merged)) {
        messageMap.set(k, merged);
      }
    } else {
      const initialKey = keys[0] || `temp_${Date.now()}_${Math.random()}`;
      for (const k of keys) {
        messageMap.set(k, m);
      }
      if (keys.length === 0) {
        messageMap.set(initialKey, m);
      }
    }
  };

  existingMessages.forEach(processMessage);
  incomingMessages.forEach(processMessage);

  const uniqueMessages = Array.from(new Set(messageMap.values()));

  return uniqueMessages.sort((a, b) => {
    const timeA = new Date(a.sentAt).getTime();
    const timeB = new Date(b.sentAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id - b.id;
  });
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, ChatMessage[]>>({});
  const [hasMoreByConv, setHasMoreByConv] = useState<Record<number, boolean>>({});
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);

  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const stompClientRef = useRef<any>(null);
  const activeSubscriptionRef = useRef<any>(null);
  const subscribedTopicIdRef = useRef<number | null>(null);
  const typingTimerRef = useRef<any>(null);

  const processedEventIdsRef = useRef<Set<string>>(new Set());

  const currentMessages = activeConversation ? (messagesByConversation[activeConversation.id] || []) : [];
  const currentHasMore = activeConversation ? (hasMoreByConv[activeConversation.id] ?? true) : false;

  const updatePurchaseRequestStatus = useCallback((requestId: number, newStatus: 'ACCEPTED' | 'DECLINED' | 'REJECTED', reason?: string) => {
    setMessagesByConversation((prev) => {
      const nextState: Record<number, ChatMessage[]> = {};
      for (const [convIdStr, msgList] of Object.entries(prev)) {
        const convId = Number(convIdStr);
        nextState[convId] = msgList.map((m) => {
          if (m.purchaseRequestId === requestId || m.purchaseRequestDetails?.requestId === requestId) {
            return {
              ...m,
              purchaseRequestDetails: {
                ...(m.purchaseRequestDetails || {
                  requestedQuantity: 0,
                  offeredPricePerKg: 0,
                  totalPrice: 0,
                  status: newStatus,
                }),
                status: newStatus,
              },
            };
          }
          return m;
        });
      }
      return nextState;
    });
  }, []);

  const refreshConversations = useCallback(async () => {
    const authToken = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
    if (!user || !authToken) return;
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (e) {
      console.warn('Failed to fetch conversations:', e);
    }
  }, [user]);

  const deleteConversation = useCallback(
    async (conversationId: number) => {
      try {
        await chatService.deleteConversation(conversationId);
      } catch (e) {
        console.warn('Backend delete request warning (proceeding with local state removal):', e);
      }

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setMessagesByConversation((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });

      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    },
    [activeConversation]
  );

  const handleWebSocketEvent = useCallback((event: any) => {
    if (!event) return;

    if (event.eventId) {
      if (processedEventIdsRef.current.has(event.eventId)) {
        return;
      }
      processedEventIdsRef.current.add(event.eventId);
      if (processedEventIdsRef.current.size > 500) {
        const first = processedEventIdsRef.current.values().next().value;
        if (first) processedEventIdsRef.current.delete(first);
      }
    }

    const eventType = event.type || event.eventType;

    if (eventType === 'NEW_MESSAGE' || eventType === 'MESSAGE_SENT') {
      const msgData = event.payload || event.data;
      if (!msgData) return;

      const formattedMsg = chatService.mapMessageResponse(msgData);
      const convId = formattedMsg.conversationId;

      setMessagesByConversation((prev) => {
        const existing = prev[convId] || [];
        return {
          ...prev,
          [convId]: deduplicateAndSortMessages(existing, [formattedMsg]),
        };
      });

      refreshConversations();
    } else if (
      eventType === 'PURCHASE_REQUEST_CREATED' ||
      eventType === 'PURCHASE_REQUEST_ACCEPTED' ||
      eventType === 'PURCHASE_REQUEST_DECLINED' ||
      eventType === 'PURCHASE_REQUEST_REJECTED'
    ) {
      const payload = event.payload || event.data;
      if (payload && payload.id) {
        const newStatus = eventType === 'PURCHASE_REQUEST_ACCEPTED' ? 'ACCEPTED' : 'DECLINED';
        updatePurchaseRequestStatus(payload.id, newStatus);
      }
      refreshConversations();
    } else if (eventType === 'TYPING') {
      const payload = event.payload || event.data;
      if (activeConversation && payload && payload.conversationId === activeConversation.id) {
        setIsOtherTyping(payload.typing);
        setTypingUser(payload.typing ? 'Participant' : null);

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        if (payload.typing) {
          typingTimerRef.current = setTimeout(() => {
            setIsOtherTyping(false);
            setTypingUser(null);
          }, 4000);
        }
      }
    } else if (eventType === 'MESSAGE_READ') {
      if (activeConversation && event.conversationId === activeConversation.id) {
        const convId = activeConversation.id;
        setMessagesByConversation((prev) => {
          const list = prev[convId] || [];
          return {
            ...prev,
            [convId]: list.map((m) => ({ ...m, status: 'READ', readAt: new Date().toISOString() })),
          };
        });
      }
    }
  }, [activeConversation, refreshConversations, updatePurchaseRequestStatus]);

  // Connect STOMP over WebSocket
  useEffect(() => {
    const authToken = localStorage.getItem('AGRIGRADE_ACCESS_TOKEN');
    if (!user || !authToken) return;

    let ws: WebSocket | null = null;
    let isCancelled = false;

    const connectWebSocket = () => {
      try {
        const apiBase = (import.meta.env.VITE_API_URL as string) || 'https://agrigrade-backend-0g8z.onrender.com/api/v1';
        let wsUrl = (import.meta.env.VITE_WS_URL as string);
        if (!wsUrl) {
          if (apiBase.startsWith('https://')) {
            wsUrl = apiBase.replace(/^https:\/\//, 'wss://').replace(/\/api\/v1\/?$/, '') + '/ws';
          } else if (apiBase.startsWith('http://')) {
            wsUrl = apiBase.replace(/^http:\/\//, 'ws://').replace(/\/api\/v1\/?$/, '') + '/ws';
          } else {
            wsUrl = 'wss://agrigrade-backend-0g8z.onrender.com/ws';
          }
        }
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isCancelled) return;
          setIsConnected(true);

          const connectFrame =
            'CONNECT\n' +
            'accept-version:1.2,1.1,1.0\n' +
            'heart-beat:10000,10000\n' +
            `Authorization:Bearer ${authToken}\n\n\0`;
          ws?.send(connectFrame);
        };

        ws.onmessage = (e) => {
          if (isCancelled) return;
          const text = e.data;

          if (text.startsWith('CONNECTED')) {
            const userNotifSub = `SUBSCRIBE\nid:sub-user-notif\ndestination:/user/queue/notifications\n\n\0`;
            ws?.send(userNotifSub);
          } else if (text.startsWith('MESSAGE')) {
            const bodyStart = text.indexOf('\n\n');
            if (bodyStart !== -1) {
              const body = text.substring(bodyStart + 2).replace(/\0$/, '');
              try {
                const parsed = JSON.parse(body);
                handleWebSocketEvent(parsed);
              } catch (err) {
                console.warn('STOMP body parse failed:', err);
              }
            }
          }
        };

        ws.onclose = () => {
          if (isCancelled) return;
          setIsConnected(false);
          setTimeout(() => {
            if (!isCancelled) connectWebSocket();
          }, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        stompClientRef.current = ws;
      } catch (err) {
        console.warn('WebSocket init exception:', err);
        setIsConnected(false);
      }
    };

    connectWebSocket();
    refreshConversations();

    return () => {
      isCancelled = true;
      if (ws) {
        try { ws.close(); } catch (ignored) {}
      }
    };
  }, [user?.id, refreshConversations, handleWebSocketEvent]);

  const selectConversation = useCallback(
    async (conversationId: number | null) => {
      if (!conversationId) {
        setActiveConversation(null);
        return;
      }

      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        setActiveConversation(conv);
      } else {
        try {
          const fetchedConv = await chatService.getConversationById(conversationId);
          if (fetchedConv) setActiveConversation(fetchedConv);
        } catch (e) {
          console.warn('Failed to fetch conversation detail:', e);
        }
      }

      try {
        const history = await chatService.getMessages(conversationId, 0, 40);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: history,
        }));
        setHasMoreByConv((prev) => ({
          ...prev,
          [conversationId]: history.length >= 40,
        }));
      } catch (e) {
        console.warn('Failed to fetch messages for conv:', conversationId, e);
      }

      if (stompClientRef.current && stompClientRef.current.readyState === WebSocket.OPEN) {
        if (subscribedTopicIdRef.current && subscribedTopicIdRef.current !== conversationId) {
          const unsubFrame = `UNSUBSCRIBE\nid:sub-conv-${subscribedTopicIdRef.current}\n\n\0`;
          stompClientRef.current.send(unsubFrame);
        }

        if (subscribedTopicIdRef.current !== conversationId) {
          const subFrame = `SUBSCRIBE\nid:sub-conv-${conversationId}\ndestination:/topic/conversations.${conversationId}\n\n\0`;
          stompClientRef.current.send(subFrame);
          subscribedTopicIdRef.current = conversationId;
        }
      }
    },
    [conversations]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeConversation || isLoadingOlder || !currentHasMore || currentMessages.length === 0) {
      return;
    }

    setIsLoadingOlder(true);
    const oldestId = currentMessages[0].id;

    try {
      const older = await chatService.getMessages(activeConversation.id, 0, 30, oldestId);
      if (older.length < 30) {
        setHasMoreByConv((prev) => ({ ...prev, [activeConversation.id]: false }));
      }

      setMessagesByConversation((prev) => {
        const existing = prev[activeConversation.id] || [];
        return {
          ...prev,
          [activeConversation.id]: deduplicateAndSortMessages(existing, older),
        };
      });
    } catch (e) {
      console.warn('Failed to load older messages:', e);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeConversation, isLoadingOlder, currentHasMore, currentMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation || !user) return;

      const clientMsgId = crypto.randomUUID();

      const tempMessage: ChatMessage = {
        id: Date.now(),
        conversationId: activeConversation.id,
        senderId: user.id,
        senderName: user.fullName || 'Me',
        senderRole: (user.roles?.[0] || 'FARMER') as any,
        messageType: 'TEXT',
        messageText: content,
        clientMessageId: clientMsgId,
        sentAt: new Date().toISOString(),
        status: 'SENT',
      };

      setMessagesByConversation((prev) => {
        const existing = prev[activeConversation.id] || [];
        return {
          ...prev,
          [activeConversation.id]: deduplicateAndSortMessages(existing, [tempMessage]),
        };
      });

      try {
        const savedMessage = await chatService.sendMessage(
          activeConversation.id,
          user.id,
          user.fullName || 'Me',
          (user.roles?.[0] || 'FARMER') as any,
          content,
          clientMsgId
        );

        setMessagesByConversation((prev) => {
          const existing = prev[activeConversation.id] || [];
          return {
            ...prev,
            [activeConversation.id]: deduplicateAndSortMessages(existing, [savedMessage]),
          };
        });
      } catch (err: any) {
        console.error('Failed to send message:', err);
        throw err;
      }
    },
    [activeConversation, user]
  );

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (!activeConversation || !stompClientRef.current || stompClientRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      try {
        const frame = `SEND\ndestination:/app/chat.typing\n\n${JSON.stringify({
          conversationId: activeConversation.id,
          typing,
        })}\0`;
        stompClientRef.current.send(frame);
      } catch (ignored) {}
    },
    [activeConversation]
  );

  const unreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        conversations,
        activeConversation,
        messages: currentMessages,
        messagesByConversation,
        unreadCount,
        isOtherTyping,
        typingUser,
        selectConversation,
        sendMessage,
        sendTyping,
        refreshConversations,
        deleteConversation,
        loadOlderMessages,
        hasMoreOlderMessages: currentHasMore,
        isLoadingOlder,
        updatePurchaseRequestStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
