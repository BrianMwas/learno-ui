
// types/chat.ts

// ============ VISUAL DATA TYPES ============

/**
 * SVG Shape Definition
 */
export interface SVGShape {
  type: 'rect' | 'circle' | 'ellipse';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rx?: number;  // for circles/ellipses
  ry?: number;  // for ellipses
  fill: string;
  label?: string;
  labelX?: number;
  labelY?: number;
}

/**
 * SVG Arrow Definition
 */
export interface SVGArrow {
  from: [number, number];
  to: [number, number];
  label?: string;
}

/**
 * SVG Data Structure (returned when visual_type is "svg")
 */
export interface SVGData {
  shapes: SVGShape[];
  arrows: SVGArrow[];
}

/**
 * Visual Data - can be Mermaid code, SVG instructions, or asset name
 */
export type VisualData = 
  | string              // For "mermaid" (Mermaid diagram code) or "premade" (asset name)
  | SVGData             // For "svg" (SVG instructions)
  | null;               // For "none" (no visual)

// ============ SLIDE TYPES ============

export interface Slide {
  slide_number: number;
  title: string;
  content: string;
  visual_description?: string;
  full_content?: string;
  topic?: string;
  key_points?: string[];
  code_example?: string;
  // ✨ NEW: Visual data fields
  visual_type?: 'mermaid' | 'svg' | 'premade' | 'none';
  visual_data?: VisualData;
}

// ============ CHAT MESSAGE TYPES ============

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  isMarkdown?: boolean;
  isStreaming?: boolean;
  timestamp?: string;
}

// ============ SESSION INFO TYPES ============

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

// ============ WEBSOCKET MESSAGE TYPES ============

export type WSMessage =
  // Client -> Server
  | { type: 'message'; content: string }
  | { type: 'resume'; answer: string }
  | { type: 'ping' }
  
  // Server -> Client (Token Streaming)
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