'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { SlidePanel } from '@/components/slides/SlidePanel';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default function Home() {
  const {
    messages,
    currentSlide,
    isConnected,
    isLoading,
    isLoadingSlide,
    isWaitingForInput,
    threadId,
    transientMessage,
    sendMessage,
    resetSession,
  } = useWebSocket();

  return (
    <div className="flex h-screen w-screen bg-white p-4 gap-4">
      <SlidePanel currentSlide={currentSlide} isLoading={isLoadingSlide} />
      <ChatPanel
        messages={messages}
        isConnected={isConnected}
        isLoading={isLoading}
        isWaitingForInput={isWaitingForInput}
        threadId={threadId}
        transientMessage={transientMessage}
        onSendMessage={sendMessage}
        onNewSession={resetSession}
      />
    </div>
  );
}
