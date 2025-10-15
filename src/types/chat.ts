export type VisualType = "mermaid" | "svg" | "premade" | "none";

export type SVGShape = {
  type: "rect" | "circle" | "ellipse";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  label: string;
  labelX: number;
  labelY: number;
};

export type SVGArrow = {
  from: [number, number];
  to: [number, number];
  label?: string;
};

export type SVGData = {
  shapes: SVGShape[];
  arrows: SVGArrow[];
};

export type VisualData = {
  type: VisualType;
  data: string | SVGData | null;  // Mermaid code, SVG data, or asset name
  fallback_text: string;
};

export type Slide = {
  slide_number: number;
  title: string;
  content: string;
  visual_description: string;
  full_content: string;
  topic: string;
  key_points?: string[];
  visual?: VisualData;
};

export type LearningState = {
  messages?: Array<{ type: string; content: string }>;
  slides?: Slide[];
  current_stage?: string;
};

export type WSMessage =
  | { type: "connection"; message: string; message_id?: string }
  | { type: "status"; message: string; stage: string; message_id?: string }
  | { type: "stream_start"; message: string; stage: string; message_id?: string }
  | { type: "stream_end"; message_id?: string }
  | { type: "progress"; stage: string; current_stage?: string; message_id?: string }
  | { type: "update"; data: LearningState; message_id?: string }
  | { type: "interrupt"; message: string; interrupt_id: string; stage: string; message_id?: string }
  | { type: "response"; message: string; slide: Slide; stage: string; current_stage?: string; message_id?: string }
  | { type: "error"; error: string; message?: string; message_id?: string };

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isMarkdown?: boolean;
  id?: string; // Unique message ID from backend or generated locally
};