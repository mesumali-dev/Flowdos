/**
 * Conversation storage service for persisting conversation IDs and metadata.
 *
 * This service handles the storage and retrieval of conversation IDs and related
 * metadata to enable users to resume conversations across page refreshes and sessions.
 */

const CONVERSATION_STORAGE_KEY = 'chatkit_conversations';
const CURRENT_CONVERSATION_KEY = 'chatkit_current_conversation';

/**
 * Interface for conversation metadata
 */
export interface ConversationMetadata {
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

/**
 * Get all stored conversations for the user
 * @param userId The user ID to get conversations for
 * @returns Array of conversation metadata
 */
export function getUserConversations(userId: string): ConversationMetadata[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const allConversations: ConversationMetadata[] = JSON.parse(stored);
    return allConversations.filter(conv => conv.userId === userId);
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}

/**
 * Save a conversation to storage
 * @param conversation The conversation metadata to save
 */
export function saveConversation(conversation: ConversationMetadata): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existing = getUserConversations(conversation.userId);
    const existingIndex = existing.findIndex(conv => conv.id === conversation.id);

    if (existingIndex !== -1) {
      // Update existing conversation
      existing[existingIndex] = {
        ...existing[existingIndex],
        ...conversation,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new conversation
      existing.push({
        ...conversation,
        createdAt: conversation.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Remove a conversation from storage
 * @param conversationId The ID of the conversation to remove
 * @param userId The user ID
 */
export function removeConversation(conversationId: string, userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existing = getUserConversations(userId);
    const filtered = existing.filter(conv => conv.id !== conversationId);

    // Update the full storage with the filtered array
    const allConversations: ConversationMetadata[] = JSON.parse(
      localStorage.getItem(CONVERSATION_STORAGE_KEY) || '[]'
    );
    const otherUsersConversations = allConversations.filter(conv => conv.userId !== userId);
    const updatedConversations = [...otherUsersConversations, ...filtered];

    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(updatedConversations));
  } catch (error) {
    console.error('Error removing conversation:', error);
  }
}

/**
 * Get the current active conversation ID
 * @returns The current conversation ID or null
 */
export function getCurrentConversationId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(CURRENT_CONVERSATION_KEY);
  } catch (error) {
    console.error('Error getting current conversation ID:', error);
    return null;
  }
}

/**
 * Set the current active conversation ID
 * @param conversationId The conversation ID to set as current
 */
export function setCurrentConversationId(conversationId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (conversationId) {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
    } else {
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
  } catch (error) {
    console.error('Error setting current conversation ID:', error);
  }
}

/**
 * Clear all conversation data for a user
 * @param userId The user ID to clear conversations for
 */
export function clearUserConversations(userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const allConversations: ConversationMetadata[] = JSON.parse(
      localStorage.getItem(CONVERSATION_STORAGE_KEY) || '[]'
    );
    const filtered = allConversations.filter(conv => conv.userId !== userId);
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(filtered));

    // Clear current conversation if it belongs to this user
    const currentId = getCurrentConversationId();
    if (currentId) {
      const currentConv = allConversations.find(conv => conv.id === currentId && conv.userId === userId);
      if (currentConv) {
        setCurrentConversationId(null);
      }
    }
  } catch (error) {
    console.error('Error clearing user conversations:', error);
  }
}