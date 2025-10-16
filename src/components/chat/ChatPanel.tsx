'use client';

import { useState, useRef, useEffect } from 'react';

import { AnimatedMarkdown } from 'flowtoken';
// import the flowtoken css in order to use the animations
import 'flowtoken/dist/styles.css';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { TextAnimate } from '../ui/text-animate';


interface ChatPanelProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  isWaitingForInput: boolean;
  threadId: string;
  stage: string;
  transientMessage: string | null;
  onSendMessage: (message: string) => void;
  onNewSession: () => void;
}


export function ChatPanel({
  messages,
  isConnected,
  isLoading,
  isWaitingForInput,
  stage,
  transientMessage,
  onSendMessage,
  onNewSession,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transientMessage]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-[31%] flex items-center justify-center">
      <div className="w-full h-full border border-black/10 rounded-[24px] flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-black/10 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-black capitalize">
            {stage ? stage.replace('_', ' ') : 'Chat'}
          </h2>
          <Button
            onClick={onNewSession}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            New Session
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 && !transientMessage ? (
              <Empty className="border-0 h-full min-h-[400px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquare />
                  </EmptyMedia>
                  <EmptyTitle>Start a conversation</EmptyTitle>
                  <EmptyDescription>
                    Send a message to begin your learning journey with Meemo. Type your question or greeting below.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {/* Regular Messages */}
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-4 py-3 rounded-[16px] transition-all ${
                        message.role === 'user'
                          ? 'max-w-[60%] bg-black text-white border border-black'
                          : message.role === 'system'
                          ? 'max-w-[85%] bg-black/5 text-black border border-black/20'
                          : 'max-w-[85%] bg-white text-black border border-transparent hover:border-black/10'
                      }`}
                    >
                      {message.isMarkdown ? (
                        <AnimatedMarkdown
                          content={message.content}
                          animation="blurIn"
                          sep='word'
                          animationDuration="0.5s"
                          animationTimingFunction="ease-in-out"
                        />
                      ) : (
                        <TextAnimate animation="slideUp" by="word">
                          {message.content}
                        </TextAnimate>
                      )}
                    </div>
                  </div>
                ))}

                {/* Transient Message (Loading State) */}
                {transientMessage && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="max-w-[85%] bg-white text-black border border-black/10 rounded-[16px] px-4 py-3">
                      <div className="flex items-start gap-3">
                        {/* Animated Spinner */}
                        <div className="mt-0.5 flex-shrink-0">
                          <Spinner className="size-4 text-black/60" />
                        </div>
                        
                        {/* Transient Message Content */}
                        <div className="flex-1">
                          <p className="text-sm text-black/70 leading-relaxed">
                            {transientMessage}
                          </p>
                        </div>
                      </div>
                      
                      {/* Typing Indicator Dots */}
                      <div className="flex items-center gap-1 mt-2 ml-7">
                        <span className="w-1.5 h-1.5 bg-black/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-black/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-black/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-black/10 flex-shrink-0">
          <div className="flex items-center gap-2 border border-black/10 rounded-full px-4 py-2.5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isWaitingForInput ? "Your answer..." : "Type a message..."}
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-black/40 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:bg-black/20 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}