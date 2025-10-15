'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Presentation } from 'lucide-react';
import { Slide } from '@/types/chat';

interface SlidePanelProps {
  currentSlide: Slide | null;
  isLoading?: boolean;
}

const TextAnimate = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

function SlidesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border-b border-black/10 pb-4">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-9 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-20 w-full mt-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SlidePanel({ currentSlide, isLoading = false }: SlidePanelProps) {
  return (
    <div className="w-[69%] flex items-center justify-center">
      <div className="w-full h-full border border-black/10 rounded-[24px] flex flex-col bg-white overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-8">
            {isLoading ? (
              <SlidesSkeleton />
            ) : currentSlide ? (
              <TextAnimate>
                <div className="space-y-4">
                  <div className="border-b border-black/10 pb-4">
                    <div className="text-xs text-black/40 mb-2">
                      Slide {currentSlide.slide_number} • {currentSlide.topic}
                    </div>
                    <h1 className="text-3xl font-bold text-black mb-3">
                      {currentSlide.title}
                    </h1>
                    <p className="text-sm text-black/60 italic">
                      {currentSlide.visual_description}
                    </p>
                  </div>

                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                        p: ({ children }) => <p className="mb-3 text-base leading-relaxed text-black">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>,
                        li: ({ children }) => <li className="text-base">{children}</li>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="px-2 py-1 rounded bg-black/5 font-mono text-sm">
                              {children}
                            </code>
                          ) : (
                            <code className="block p-4 rounded-lg bg-black/5 font-mono text-sm overflow-x-auto my-3">
                              {children}
                            </code>
                          );
                        },
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {currentSlide.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </TextAnimate>
            ) : (
              <Empty className="border-0 h-full min-h-[500px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Presentation />
                  </EmptyMedia>
                  <EmptyTitle>No slides yet</EmptyTitle>
                  <EmptyDescription>
                    Slides will appear here as you progress through your learning journey. Start a conversation with Meemo to begin.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
