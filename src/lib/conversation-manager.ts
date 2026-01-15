/**
 * Conversation management utilities for ChatKit integration
 * Provides methods to manage conversation state and history
 */

import { chatApiAdapter } from './chat-api-adapter';

// Type definitions
interface ConversationHistory {
  id: string;
  title?: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
  }>;
}

/**
 * Get conversation history from the backend
 */
export async function getConversationHistory(userId: string, conversationId: string): Promise<ConversationHistory> {
  try {
    const response = await chatApiAdapter.getConversation(userId, conversationId);
    return {
      id: response.id,
      title: response.title,
      messages: response.messages || [],
    };
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    throw error;
  }
}

/**
 * Get user's last conversation
 */
export async function getLastConversation(userId: string): Promise<{ conversation_id: string; title?: string; updated_at?: string }> {
  try {
    const response = await chatApiAdapter.getLastConversation(userId);
    return response;
  } catch (error) {
    console.error('Error getting last conversation:', error);
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createNewConversation(userId: string): Promise<{ conversation_id: string; title?: string }> {
  // For now, we'll start a new conversation by not passing a conversation_id
  // The backend will create a new one when sendMessage is called without conversation_id
  return { conversation_id: '', title: 'New Conversation' };
}

/**
 * Save conversation to backend (if needed)
 */
export async function saveConversation(userId: string, conversationId: string, title?: string): Promise<void> {
  try {
    // Update the conversation's metadata in the backend
    await chatApiAdapter.updateLastConversation(userId, conversationId);
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

/**
 * Get all conversations for a user
 */
export async function getAllConversations(userId: string): Promise<Array<{ id: string; title?: string; created_at: string; updated_at: string }>> {
  try {
    const response = await chatApiAdapter.getUserConversations(userId);
    return response.conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
}

/**
 * Switch to a specific conversation
 */
export async function switchToConversation(userId: string, conversationId: string): Promise<ConversationHistory> {
  try {
    return await getConversationHistory(userId, conversationId);
  } catch (error) {
    console.error('Error switching to conversation:', error);
    throw error;
  }
}