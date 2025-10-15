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
  const wsRef = useRef<WebSocket | null>(null);

  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    console.log('Received:', message);

    switch (message.type) {
      case 'connection':
        setMessages([{
          role: 'assistant',
          content: 'Connecting to Meemo...',
          isMarkdown: false
        }]);
        break;

      case 'status':
        setTransientMessage(message.message);
        setStage(message.stage);
        setTimeout(() => setTransientMessage(null), 2000);
        break;

      case 'update':
        const latestMsg = message.data.messages?.[message.data.messages.length - 1];
        if (latestMsg?.type === 'ai' && latestMsg.content) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant') {
              return [...prev.slice(0, -1), {
                role: 'assistant',
                content: latestMsg.content,
                isMarkdown: true
              }];
            } else {
              return [...prev, {
                role: 'assistant',
                content: latestMsg.content,
                isMarkdown: true
              }];
            }
          });
        }

        if (message.data.slides && message.data.slides.length > 0) {
          setIsLoadingSlide(true);
          const latestSlide = message.data.slides[message.data.slides.length - 1];
          setCurrentSlide(latestSlide);
          setTimeout(() => setIsLoadingSlide(false), 500);
        }
        setStage(message.data.current_stage || stage);
        break;

      case 'interrupt':
        setIsLoading(false);
        setIsWaitingForInput(true);
        setStage(message.stage);

        if (message.message) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: message.message,
            isMarkdown: true
          }]);
        }
        setTransientMessage(null);
        break;

      case 'response':
        setIsLoading(false);
        setIsWaitingForInput(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: message.message,
          isMarkdown: true
        }]);

        if (message.slide) {
          setCurrentSlide(message.slide);
        }
        setStage(message.stage);
        break;

      case 'error':
        setIsLoading(false);
        setTransientMessage(null);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Error: ${message.error}`,
          isMarkdown: false
        }]);
        break;
    }
  }, [stage, threadId]);

  useEffect(() => {
    if (!threadId) return;

    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        console.log('Attempting to connect to WebSocket with thread_id:', threadId);
        const websocket = new WebSocket(`ws://localhost:8000/ws/chat/${threadId}`);

        websocket.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          setIsConnected(true);
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

          // Auto-reconnect after 3 seconds
          console.log('Attempting to reconnect in 3 seconds...');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
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
  }, [threadId, handleWebSocketMessage]);

  const sendMessage = useCallback((userMessage: string) => {
    if (!userMessage.trim() || !ws || !isConnected) return;

    setIsLoading(true);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      isMarkdown: false
    }]);

    if (isWaitingForInput && threadId) {
      ws.send(JSON.stringify({
        type: 'resume',
        thread_id: threadId,
        answer: userMessage
      }));
      setIsWaitingForInput(false);
    } else {
      ws.send(JSON.stringify({
        type: 'chat',
        message: userMessage,
        thread_id: threadId
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

    setThreadId(newThreadId);
    setMessages([]);
    setCurrentSlide(null);
    setStage('introduction');
    setIsWaitingForInput(false);
    setTransientMessage(null);
    setIsLoading(false);
    setIsLoadingSlide(false);
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
    sendMessage,
    resetSession,
  };
}
