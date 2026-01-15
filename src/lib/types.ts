/**
 * TypeScript types for messages and conversations in the chat interface.
 *
 * Defines the interfaces for message objects, conversation objects, and other
 * related data structures used throughout the chat application.
 */

/**
 * Type for message sender
 */
export type MessageSender = 'user' | 'assistant' | 'system';

/**
 * Type for message status
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'error';

/**
 * Interface for message objects
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

/**
 * Interface for conversation objects
 */
export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: Date;
  updated_at: Date;
  messages: Message[];
}

/**
 * Interface for chat request
 */
export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

/**
 * Interface for chat response
 */
export interface ChatResponse {
  conversation_id: string;
  message: string;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

/**
 * Interface for conversation history response
 */
export interface ConversationHistoryResponse {
  conversations: Conversation[];
}

/**
 * Interface for a single message response
 */
export interface MessageResponse {
  message: Message;
}

/**
 * Interface for error responses
 */
export interface ErrorResponse {
  error: string;
  detail?: string;
}