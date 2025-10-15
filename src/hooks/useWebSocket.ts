'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WSMessage, ChatMessage, Slide } from '@/types/chat';

export function useWebSocket() {
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

  // --- internal refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());
  const messageBuffer = useRef<WSMessage[]>([]);
  const isManuallyClosed = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 1000; // base
  const HEARTBEAT_INTERVAL = 30000;

  // ✅ Message deduplication
  const isMessageSeen = useCallback((id?: string) => {
    if (!id) return false;
    if (seenMessageIds.current.has(id)) return true;
    seenMessageIds.current.add(id);
    if (seenMessageIds.current.size > 100) {
      const arr = Array.from(seenMessageIds.current);
      arr.slice(0, arr.length - 100).forEach(i => seenMessageIds.current.delete(i));
    }
    return false;
  }, []);

  // ✅ Main message handler
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    if ('message_id' in message && message.message_id && isMessageSeen(message.message_id)) {
      return;
    }

    switch (message.type) {
      case 'pong':
        console.log('💓 Heartbeat pong');
        return;
      case 'stream_start':
        setTransientMessage(message.message);
        setIsLoading(true);
        setStage(message.stage);
        break;
      case 'progress':
        setStage(message.current_stage || message.stage);
        break;
      case 'status':
        setTransientMessage(message.message);
        setTimeout(() => setTransientMessage(null), 2000);
        break;
      case 'update': {
        const latestMsg = message.data.messages?.slice(-1)[0];
        if (latestMsg?.type === 'ai' && latestMsg.content) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: latestMsg.content,
            id: message.message_id,
            isMarkdown: true
          }]);
        }
        if (message.data.slides?.length) {
          const latestSlide = message.data.slides.slice(-1)[0];
          setIsLoadingSlide(true);
          setCurrentSlide(latestSlide);
          setTimeout(() => setIsLoadingSlide(false), 500);
          if (latestSlide.topic && !topicsCovered.includes(latestSlide.topic)) {
            setTopicsCovered(prev => [...prev, latestSlide.topic]);
          }
        }
        setStage(message.data.current_stage || stage);
        break;
      }
      case 'interrupt':
        setIsLoading(false);
        setIsWaitingForInput(true);
        setStage(message.stage);
        if (message.message) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: message.message,
            id: message.message_id,
            isMarkdown: true
          }]);
        }
        break;
      case 'response':
        setIsLoading(false);
        setIsWaitingForInput(false);
        if (message.message) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: message.message,
            id: message.message_id,
            isMarkdown: true
          }]);
        }
        if (message.slide) {
          setIsLoadingSlide(true);
          setCurrentSlide(message.slide);
          setTimeout(() => setIsLoadingSlide(false), 500);
          if (message.slide.topic && !topicsCovered.includes(message.slide.topic)) {
            setTopicsCovered(prev => [...prev, message.slide.topic]);
          }
        }
        setStage(message.current_stage || message.stage);
        break;
      case 'error':
        console.error('❌ Error:', message.message);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Error: ${message.message}`,
          isMarkdown: false
        }]);
        setIsLoading(false);
        break;
      case 'stream_end':
        setIsLoading(false);
        setTransientMessage(null);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [isMessageSeen, stage, topicsCovered]);

  // ✅ Start heartbeat
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatTimer.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = null;
  }, []);

  // ✅ Safe send with buffer
  const sendSafe = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.log('📦 Buffered message:', msg.type);
      messageBuffer.current.push(msg);
    }
  }, []);

  // ✅ Flush buffer
  const flushBuffer = useCallback(() => {
    if (messageBuffer.current.length && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(`🚀 Sending ${messageBuffer.current.length} buffered messages`);
      messageBuffer.current.forEach(m => wsRef.current?.send(JSON.stringify(m)));
      messageBuffer.current = [];
    }
  }, []);

  // ✅ Connect + Reconnect logic
  const connect = useCallback(() => {
    if (isManuallyClosed.current) return;

    const wsUrl = `ws://localhost:8000/api/v1/ws/chat/${threadId}`;
    console.log('🔌 Connecting to', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ Connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      wsRef.current = socket;
      flushBuffer();
      startHeartbeat();
      setIsLoading(true);
    };

    socket.onmessage = event => {
      try {
        handleWebSocketMessage(JSON.parse(event.data));
      } catch (e) {
        console.error('Error parsing WebSocket message', e);
      }
    };

    socket.onerror = err => {
      console.error('WebSocket error', err);
      setIsConnected(false);
    };

    socket.onclose = event => {
      console.warn('❌ Disconnected', event.code, event.reason);
      setIsConnected(false);
      stopHeartbeat();
      wsRef.current = null;

      if (!isManuallyClosed.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
        console.log(`⏳ Reconnecting in ${delay}ms`);
        reconnectTimer.current = setTimeout(connect, delay);
        reconnectAttempts.current++;
      } else {
        console.error('❌ Max reconnect attempts reached');
      }
    };
  }, [handleWebSocketMessage, startHeartbeat, stopHeartbeat, flushBuffer, threadId]);

  // ✅ Lifecycle
  useEffect(() => {
    connect();
    return () => {
      isManuallyClosed.current = true;
      stopHeartbeat();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect, stopHeartbeat]);

  // ✅ Public actions
  const sendMessage = useCallback((message: string) => {
    const msg: WSMessage = {
      type: isWaitingForInput ? 'resume' : 'message',
      content: message
    };
    sendSafe(msg);
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      isMarkdown: false,
      id: uuidv4()
    }]);
    setIsWaitingForInput(false);
  }, [isWaitingForInput, sendSafe]);

  const resetSession = useCallback(() => {
    setThreadId(uuidv4());
    setMessages([]);
    setCurrentSlide(null);
    setStage('introduction');
    setTopicsCovered([]);
  }, []);

  return {
    ws: wsRef.current,
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
    sendMessage,
    resetSession
  };
}
