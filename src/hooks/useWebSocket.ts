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
  const [currentNode, setCurrentNode] = useState<string | null>(null);

  // --- internal refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());
  const messageBuffer = useRef<WSMessage[]>([]);
  const isManuallyClosed = useRef(false);
  
  // ✨ Track streaming state
  const streamingMessageRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 1000;
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

  // ✨ Start streaming a new message
  const startStreamingMessage = useCallback(() => {
    streamingMessageRef.current = '';
    streamingMessageIdRef.current = uuidv4();
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      id: streamingMessageIdRef.current!,
      isMarkdown: true,
      isStreaming: true
    }]);
  }, []);

  // ✨ Update streaming message with new token
  const appendToken = useCallback((token: string) => {
    streamingMessageRef.current += token;
    
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.id === streamingMessageIdRef.current) {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMsg,
            content: streamingMessageRef.current,
            isStreaming: true
          }
        ];
      }
      return prev;
    });
  }, []);

  // ✨ Finalize streaming message
  const finalizeStreamingMessage = useCallback(() => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.id === streamingMessageIdRef.current) {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMsg,
            content: streamingMessageRef.current,
            isStreaming: false
          }
        ];
      }
      return prev;
    });
    
    streamingMessageRef.current = '';
    streamingMessageIdRef.current = null;
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
        console.log('🎬 Stream started:', message.message);
        setTransientMessage(message.message ?? null); // FIX: Handle undefined
        setIsLoading(true);
        if (message.stage) setStage(message.stage);
        startStreamingMessage();
        break;

      case 'node_start':
        console.log('🔧 Node started:', message.node);
        setCurrentNode(message.node || null);
        break;

      case 'node_complete':
        console.log('✅ Node completed:', message.node);
        break;

      case 'token':
        console.log('📝 Token received:', message.content?.substring(0, 20));
        if (message.content) {
          appendToken(message.content);
        }
        break;

      case 'stage_change':
        console.log('🔄 Stage changed:', message.stage);
        setStage(message.stage || 'teaching');
        setTransientMessage(`Moving to: ${message.stage}`);
        setTimeout(() => setTransientMessage(null), 2000);
        break;

      case 'slide':
        console.log('🖼️ Slide updated:', message.slide?.title);
        setIsLoadingSlide(true);
        setCurrentSlide(message.slide || null);
        setTimeout(() => setIsLoadingSlide(false), 500);
        
        // FIX: Type-safe topic handling
        if (message.slide?.topic) {
          const topic = message.slide.topic;
          if (!topicsCovered.includes(topic)) {
            setTopicsCovered(prev => [...prev, topic]);
          }
        }
        break;

      case 'response_complete':
        console.log('✅ Response complete');
        setIsLoading(false);
        setIsWaitingForInput(false);
        setCurrentNode(null);
        
        finalizeStreamingMessage();
        
        if (message.slide) {
          setIsLoadingSlide(true);
          setCurrentSlide(message.slide);
          setTimeout(() => setIsLoadingSlide(false), 500);
          
          // FIX: Type-safe topic handling
          if (message.slide.topic) {
            const topic = message.slide.topic;
            if (!topicsCovered.includes(topic)) {
              setTopicsCovered(prev => [...prev, topic]);
            }
          }
        }
        
        if (message.stage) {
          setStage(message.stage);
        }
        break;

      case 'stream_end':
        console.log('🏁 Stream ended');
        setIsLoading(false);
        setTransientMessage(null);
        setCurrentNode(null);
        break;

      case 'progress':
        // FIX: Type-safe stage handling
        const progressStage = message.current_stage || message.stage;
        if (progressStage) {
          setStage(progressStage);
        }
        break;

      case 'status':
        setTransientMessage(message.message ?? null); // FIX: Handle undefined
        setTimeout(() => setTransientMessage(null), 2000);
        break;

      case 'update': {
        const latestMsg = message.data?.messages?.slice(-1)[0];
        if (latestMsg?.type === 'ai' && latestMsg.content) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: latestMsg.content,
            id: message.message_id || uuidv4(),
            isMarkdown: true
          }]);
        }
        if (message.data?.slides?.length) {
          const latestSlide = message.data.slides.slice(-1)[0];
          setIsLoadingSlide(true);
          setCurrentSlide(latestSlide);
          setTimeout(() => setIsLoadingSlide(false), 500);
          
          // FIX: Type-safe topic handling
          if (latestSlide.topic) {
            const topic = latestSlide.topic;
            if (!topicsCovered.includes(topic)) {
              setTopicsCovered(prev => [...prev, topic]);
            }
          }
        }
        if (message.data?.current_stage) {
          setStage(message.data.current_stage);
        }
        break;
      }

      case 'interrupt':
        setIsLoading(false);
        setIsWaitingForInput(true);
        setStage(message.stage || 'awaiting_input');
        
        // FIX: Type-safe message handling
        if (message.message) {
          const content = message.message;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: content,
            id: message.message_id || uuidv4(),
            isMarkdown: true
          }]);
        }
        break;

      case 'response':
        setIsLoading(false);
        setIsWaitingForInput(false);
        
        // FIX: Type-safe message handling
        if (message.message) {
          const content = message.message;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: content,
            id: message.message_id || uuidv4(),
            isMarkdown: true
          }]);
        }
        
        if (message.slide) {
          setIsLoadingSlide(true);
          setCurrentSlide(message.slide);
          setTimeout(() => setIsLoadingSlide(false), 500);
          
          // FIX: Type-safe topic handling
          if (message.slide.topic) {
            const topic = message.slide.topic;
            if (!topicsCovered.includes(topic)) {
              setTopicsCovered(prev => [...prev, topic]);
            }
          }
        }
        
        // FIX: Type-safe stage handling
        const responseStage = message.current_stage || message.stage;
        if (responseStage) {
          setStage(responseStage);
        }
        break;

      case 'error':
        console.error('❌ Error:', message.message);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Error: ${message.message}`,
          isMarkdown: false
        }]);
        setIsLoading(false);
        setCurrentNode(null);
        
        if (streamingMessageIdRef.current) {
          finalizeStreamingMessage();
        }
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [
    isMessageSeen, 
    topicsCovered, 
    startStreamingMessage, 
    appendToken, 
    finalizeStreamingMessage
  ]);

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

    const wsUrl = `wss://learno-production.up.railway.app/api/v1/ws/chat/${threadId}`;
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
    const msg: WSMessage = isWaitingForInput
      ? { type: 'resume', answer: message }
      : { type: 'message', content: message };
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
    setCurrentNode(null);
    streamingMessageRef.current = '';
    streamingMessageIdRef.current = null;
  }, []);

  return {
    ws: wsRef.current,
    threadId,
    isConnected,
    messages,
    currentSlide,
    stage,
    currentNode,
    isWaitingForInput,
    transientMessage,
    isLoading,
    isLoadingSlide,
    topicsCovered,
    sendMessage,
    resetSession
  };
}