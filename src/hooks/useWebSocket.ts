'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WSMessage, ChatMessage, Slide } from '@/types/chat';

interface WebSocketState {
  ws: WebSocket | null;
  threadId: string;
  isConnected: boolean;
  messages: ChatMessage[];
  currentSlide: Slide | null;
  stage: string;
  isWaitingForInput: boolean;
  transientMessage: string | null;
  isLoading: boolean;
  isLoadingSlide: boolean;
  topicsCovered: string[];
  totalTopics: number;
}

interface WebSocketActions {
  sendMessage: (message: string) => void;
  resetSession: () => void;
}

export function useWebSocket(): WebSocketState & WebSocketActions {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [threadId, setThreadId] = useState<string>(() => uuidv4());
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [stage, setStage] = useState<string>('introduction');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [transientMessage, setTransientMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlide, setIsLoadingSlide] = useState(false);
  const [topicsCovered, setTopicsCovered] = useState<string[]>([]);
  const [totalTopics, setTotalTopics] = useState<number>(5);
  const wsRef = useRef<WebSocket | null>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());

  // Helper to check if we've seen this message before
  const isMessageSeen = useCallback((messageId?: string, content?: string) => {
    if (messageId) {
      if (seenMessageIds.current.has(messageId)) {
        console.log('⏭️  Skipping duplicate message:', messageId);
        return true;
      }
      seenMessageIds.current.add(messageId);
      return false;
    }
    // Fallback to content-based check if no ID provided (backward compatibility)
    return false;
  }, []);

  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    console.log('📩 Received:', message.type, message);

    switch (message.type) {
      case 'stream_start':
        // Show transient "Processing..." message
        console.log('🔄 Stream started');
        setTransientMessage(message.message);
        setIsLoading(true);
        setStage(message.stage);
        break;

      case 'progress':
        // Optional: Update progress indicator
        // No slide data yet, just stage info
        console.log('⏳ Progress update');
        if (message.current_stage) {
          setStage(message.current_stage);
        } else {
          setStage(message.stage);
        }
        break;

      case 'status':
        // Transient status message (fallback for stream_start)
        setTransientMessage(message.message);
        setStage(message.stage);
        setTimeout(() => setTransientMessage(null), 2000);
        break;

      case 'update':
        const latestMsg = message.data.messages?.[message.data.messages.length - 1];
        if (latestMsg?.type === 'ai' && latestMsg.content) {
          // Use message_id if available, otherwise check content
          const msgId = message.message_id;

          if (isMessageSeen(msgId, latestMsg.content)) {
            break; // Skip duplicate
          }

          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];

            // Content-based fallback check if no ID
            if (!msgId) {
              const messageExists = prev.some(msg =>
                msg.role === 'assistant' && msg.content === latestMsg.content
              );
              if (messageExists) {
                return prev;
              }
            }

            if (lastMsg?.role === 'assistant' && lastMsg.content !== latestMsg.content) {
              return [...prev.slice(0, -1), {
                role: 'assistant',
                content: latestMsg.content,
                isMarkdown: true,
                id: msgId
              }];
            } else {
              return [...prev, {
                role: 'assistant',
                content: latestMsg.content,
                isMarkdown: true,
                id: msgId
              }];
            }
          });
        }

        if (message.data.slides && message.data.slides.length > 0) {
          setIsLoadingSlide(true);
          const latestSlide = message.data.slides[message.data.slides.length - 1];
          setCurrentSlide(latestSlide);
          setTimeout(() => setIsLoadingSlide(false), 500);

          // Track topics covered
          if (latestSlide.topic && !topicsCovered.includes(latestSlide.topic)) {
            setTopicsCovered(prev => [...prev, latestSlide.topic]);
          }
        }
        setStage(message.data.current_stage || stage);
        break;

      case 'interrupt':
        // 🔥 CRITICAL: Set waiting flag
        console.log('⚠️ Interrupt - waiting for user input');
        setIsLoading(false);
        setIsWaitingForInput(true);
        setStage(message.stage);
        setTransientMessage(null);

        // Add AI's message (the question they're asking)
        if (message.message && !isMessageSeen(message.message_id, message.message)) {
          setMessages(prev => {
            // Content-based fallback check if no ID
            if (!message.message_id) {
              const messageExists = prev.some(msg =>
                msg.role === 'assistant' && msg.content === message.message
              );
              if (messageExists) {
                return prev;
              }
            }
            return [...prev, {
              role: 'assistant',
              content: message.message,
              isMarkdown: true,
              id: message.message_id
            }];
          });
        }
        break;

      case 'response':
        // Final response with slide
        console.log('✅ Final response received');
        setIsLoading(false);
        setIsWaitingForInput(false);
        setTransientMessage(null);

        if (!isMessageSeen(message.message_id, message.message)) {
          setMessages(prev => {
            // Content-based fallback check if no ID
            if (!message.message_id) {
              const messageExists = prev.some(msg =>
                msg.role === 'assistant' && msg.content === message.message
              );
              if (messageExists) {
                return prev;
              }
            }
            return [...prev, {
              role: 'assistant',
              content: message.message,
              isMarkdown: true,
              id: message.message_id
            }];
          });
        }

        if (message.slide) {
          setIsLoadingSlide(true);
          setCurrentSlide(message.slide);
          setTimeout(() => setIsLoadingSlide(false), 500);

          // Track topics covered
          if (message.slide.topic && !topicsCovered.includes(message.slide.topic)) {
            setTopicsCovered(prev => [...prev, message.slide.topic]);
          }
        }

        if (message.current_stage) {
          setStage(message.current_stage);
        } else {
          setStage(message.stage);
        }
        break;

      case 'stream_end':
        // Cleanup after streaming
        console.log('🏁 Stream ended');
        setIsLoading(false);
        setTransientMessage(null);
        break;

      case 'error':
        // Handle error
        console.error('❌ Error:', message.error);
        setIsLoading(false);
        setTransientMessage(null);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Error: ${message.message || message.error}`,
          isMarkdown: false
        }]);
        break;
    }
  }, [stage, threadId]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        console.log('Attempting to connect to WebSocket...');
        console.log('Using thread_id:', threadId);
        const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${threadId}`;
        console.log('Connecting to:', wsUrl);
        const websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          setIsConnected(true);
          setIsLoading(true);  // Show spinner while waiting for first message
          wsRef.current = websocket;
          setWs(websocket);
        };

        websocket.onmessage = (event) => {
          try {
            handleWebSocketMessage(JSON.parse(event.data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.log('Make sure your backend server is running on http://localhost:8000');
          setIsConnected(false);
        };

        websocket.onclose = (event) => {
          console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
          setIsConnected(false);
          wsRef.current = null;
          setWs(null);

          // Only auto-reconnect on abnormal closures (not normal close or going away)
          if (event.code !== 1000 && event.code !== 1001) {
            console.log('Attempting to reconnect in 3 seconds...');
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          } else {
            console.log('WebSocket closed normally. Not reconnecting.');
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [handleWebSocketMessage]);

  const sendMessage = useCallback((userMessage: string) => {
    if (!userMessage.trim() || !ws || !isConnected) return;

    setIsLoading(true);

    // Generate a unique ID for user messages
    const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      isMarkdown: false,
      id: userMsgId
    }]);

    if (isWaitingForInput) {
      ws.send(JSON.stringify({
        type: 'resume',
        answer: userMessage
      }));
      setIsWaitingForInput(false);
    } else {
      ws.send(JSON.stringify({
        type: 'chat',
        message: userMessage
      }));
    }
  }, [ws, isConnected, isWaitingForInput, threadId]);

  const resetSession = useCallback(() => {
    if (ws) {
      ws.close();
    }

    // Generate new thread ID for new session
    const newThreadId = uuidv4();
    console.log('Starting new session with thread_id:', newThreadId);

    // Clear seen message IDs for new session
    seenMessageIds.current.clear();

    setThreadId(newThreadId);
    setMessages([]);
    setCurrentSlide(null);
    setStage('introduction');
    setIsWaitingForInput(false);
    setTransientMessage(null);
    setIsLoading(false);
    setIsLoadingSlide(false);
    setTopicsCovered([]);
  }, [ws]);

  return {
    ws,
    threadId,
    isConnected,
    messages,
    currentSlide,
    stage,
    isWaitingForInput,
    transientMessage,
    isLoading,
    isLoadingSlide,
    topicsCovered,
    totalTopics,
    sendMessage,
    resetSession,
  };
}
