'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Presentation } from 'lucide-react';
import { Slide } from '@/types/chat';
import { VisualRenderer } from './VisualRenderer';

interface SlidePanelProps {
  currentSlide: Slide | null;
  isLoading?: boolean;
  topicsCovered?: string[];
  totalTopics?: number;
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

export function SlidePanel({ currentSlide, isLoading = false, topicsCovered = [], totalTopics = 5 }: SlidePanelProps) {
  return (
    <div className="w-[69%] flex flex-col">
      {/* Learning Topic Header - Outside the box */}
      {currentSlide && (
        <div className="mb-2 px-2">
          <h2 className="text-sm font-semibold text-black/70 flex items-center gap-2">
            <span className="text-blue-600">Learning:</span>
            <span className="text-black">{currentSlide.topic}</span>
          </h2>
        </div>
      )}

      <div className="flex-1 border border-black/10 rounded-[24px] flex flex-col bg-white overflow-hidden">
        {/* Progress Bar */}
        {topicsCovered.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-black/60 whitespace-nowrap">Progress: {topicsCovered.length}/{totalTopics} topics</span>
              <Progress value={(topicsCovered.length / totalTopics) * 100} className="h-2 flex-1" />
            </div>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-8">
            {isLoading ? (
              <SlidesSkeleton />
            ) : currentSlide ? (
              <TextAnimate>
                <div className="space-y-4">
                  <div className="border-b border-blue-100 pb-4">
                    <div className="text-xs text-black/40 mb-2 flex items-center gap-2">
                      <span className="text-blue-600 font-medium">Slide {currentSlide.slide_number}</span>
                      <span>•</span>
                      <span>{currentSlide.topic}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-black mb-3">
                      {currentSlide.title}
                    </h1>
                    <p className="text-sm text-blue-900/60 italic">
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

                  {/* Visual Renderer */}
                  {currentSlide.visual && (
                    <VisualRenderer visual={currentSlide.visual} />
                  )}
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
