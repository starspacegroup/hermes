/**
 * AI Chat types and interfaces
 */

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: AIChatAttachment[];
  productLink?: {
    productId: string;
    productName: string;
  };
}

export interface AIChatAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
}

export interface AISession {
  id: string;
  user_id: string;
  site_id: string;
  title: string;
  messages: AIChatMessage[];
  context?: AISessionContext;
  status: 'active' | 'completed' | 'archived';
  created_at: number;
  updated_at: number;
  expires_at?: number;
}

export interface AISessionContext {
  draft_product_id?: string;
  draft_revision_id?: string;
  product_id?: string;
  [key: string]: unknown;
}

export interface AISettings {
  ai_chat_enabled?: boolean;
  openai_api_key?: string;
  anthropic_api_key?: string;
  grok_api_key?: string;
  preferred_model?: AIModel;
  temperature?: number;
  max_tokens?: number;
  cost_limit_daily?: number;
  rate_limit_per_minute?: number;
}

export type AIProvider = 'openai' | 'anthropic' | 'grok';

export type AIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'grok-beta';

export interface AIModelConfig {
  provider: AIProvider;
  model: AIModel;
  supportsVision: boolean;
  maxTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AIProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  type: 'physical' | 'service' | 'digital';
  stock?: number;
  images?: string[];
  videos?: string[];
  variants?: AIProductVariant[];
  fulfillmentOptions?: AIFulfillmentOption[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface AIFulfillmentOption {
  providerId: string;
  providerName?: string;
  cost: number;
  stockQuantity: number;
  enabled: boolean;
}

export interface AIProductVariant {
  name: string;
  options: string[];
  prices?: Record<string, number>;
}

export interface AIUsageLog {
  id: string;
  session_id: string;
  site_id: string;
  user_id: string;
  provider: AIProvider;
  model: AIModel;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  timestamp: number;
}
