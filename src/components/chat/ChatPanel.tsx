'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

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

const TextAnimate = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

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
  }, [messages]);

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

        {/* Transient Message Banner */}
        {transientMessage && (
          <div className="mx-4 mt-3 p-3 border-l-2 border-blue-600 bg-blue-50 rounded-r-lg animate-pulse flex-shrink-0">
            <p className="text-blue-900 text-xs flex items-center gap-2 font-medium">
              <Spinner className="size-3 text-blue-600" />
              {transientMessage}
            </p>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
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
                      <TextAnimate className="text-sm">
                        {message.isMarkdown ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className={`px-1.5 py-0.5 rounded ${message.role === 'user' ? 'bg-white/20' : 'bg-black/5'} font-mono text-xs`}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className={`block p-2 rounded-lg ${message.role === 'user' ? 'bg-white/10' : 'bg-black/5'} font-mono text-xs overflow-x-auto my-2`}>
                                    {children}
                                  </code>
                                );
                              },
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </TextAnimate>
                    </div>
                  </div>
                ))}
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
              disabled={isLoading || !isConnected}
              className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-black/40 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !isConnected}
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
