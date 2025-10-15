// types/chat.ts

export interface Slide {
  slide_number: number;
  title: string;
  content: string;
  visual_description?: string;
  full_content?: string;
  topic?: string;
  key_points?: string[];
  code_example?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  isMarkdown?: boolean;
  isStreaming?: boolean; // ✨ NEW: Indicate if message is being streamed
  timestamp?: string;
}

export interface SessionInfo {
  current_topic?: string;
  topics_covered: string[];
  topics_remaining: string[];
  understanding_level: 'beginner' | 'intermediate' | 'advanced';
  assessments_passed: number;
  questions_asked: number;
  user_name?: string;
  learning_goal?: string;
  current_slide_index: number;
  total_slides: number;
}

// WebSocket Message Types
export type WSMessage = 
  // Client -> Server
  | { type: 'message'; content: string }
  | { type: 'resume'; answer: string }
  | { type: 'ping' }
  
  // Server -> Client (New Token Streaming Types)
  | {
      type: 'stream_start';
      message?: string;
      stage?: string;
      message_id?: string;
    }
  | {
      type: 'token';
      content: string;
      node?: string;
      accumulated_length?: number;
      message_id?: string;
    }
  | {
      type: 'node_start';
      node: string;
      message_id?: string;
    }
  | {
      type: 'node_complete';
      node: string;
      message_id?: string;
    }
  | {
      type: 'stage_change';
      stage: string;
      node?: string;
      message_id?: string;
    }
  | {
      type: 'slide';
      slide: Slide;
      slide_index: number;
      total_slides: number;
      message_id?: string;
    }
  | {
      type: 'response_complete';
      message: string;
      slide?: Slide;
      thread_id?: string;
      stage?: string;
      current_topic?: string;
      topics_covered?: string[];
      topics_remaining?: string[];
      understanding_level?: 'beginner' | 'intermediate' | 'advanced';
      assessments_passed?: number;
      questions_asked?: number;
      user_name?: string;
      learning_goal?: string;
      current_slide_index?: number;
      total_slides?: number;
      message_id?: string;
    }
  | {
      type: 'stream_end';
      total_chunks?: number;
      message_length?: number;
      message_id?: string;
    }
  | {
      type: 'pong';
      timestamp?: string;
      message_id?: string;
    }
  | {
      type: 'error';
      message: string;
      technical_details?: string;
      message_id?: string;
    }
  
  // Legacy types (backwards compatibility)
  | {
      type: 'progress';
      stage?: string;
      current_stage?: string;
      messages_count?: number;
      message_id?: string;
    }
  | {
      type: 'status';
      message: string;
      message_id?: string;
    }
  | {
      type: 'update';
      data: {
        messages?: Array<{ type: string; content: string }>;
        slides?: Slide[];
        current_stage?: string;
      };
      message_id?: string;
    }
  | {
      type: 'interrupt';
      message?: string;
      interrupt_id?: string;
      stage: string;
      thread_id?: string;
      current_slide_index?: number;
      total_slides?: number;
      message_id?: string;
    }
  | {
      type: 'response';
      message?: string;
      slide?: Slide;
      thread_id?: string;
      current_stage?: string;
      stage?: string;
      current_topic?: string;
      topics_covered?: string[];
      current_slide_index?: number;
      total_slides?: number;
      message_id?: string;
    };