export type Slide = {
  slide_number: number;
  title: string;
  content: string;
  visual_description: string;
  full_content: string;
  topic: string;
};

export type LearningState = {
  messages?: Array<{ type: string; content: string }>;
  slides?: Slide[];
  current_stage?: string;
};

export type WSMessage =
  | { type: "connection"; message: string; thread_id?: string }
  | { type: "stream_start"; message: string; stage: string }
  | { type: "progress"; stage: string; current_stage?: string }
  | { type: "status"; message: string; stage: string }
  | { type: "update"; data: LearningState }
  | { type: "interrupt"; message: string; interrupt_id: string; stage: string }
  | { type: "response"; message: string; slide?: Slide; stage: string; current_stage?: string }
  | { type: "stream_end"; stage: string }
  | { type: "error"; error: string; message: string };

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isMarkdown?: boolean;
};
