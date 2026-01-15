/**
 * API adapter for ChatKit integration with backend services
 * Provides methods to interact with chat-related backend APIs
 */

import { getToken } from './auth-helper';
import { fetchConversation as fetchBackendConversation, fetchUserConversations as fetchBackendUserConversations } from './api-conversation-wrapper';

// Types for API responses
interface LastConversationResponse {
  conversation_id: string;
  title?: string;
  updated_at?: string;
}

interface SendMessageRequest {
  message: string;
  conversation_id?: string;
}

interface SendMessageResponse {
  response: string;
  conversation_id: string;
  message_id?: string;
}

interface UserConversationsResponse {
  conversations: Array<{
    id: string;
    title?: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface GetConversationResponse {
  id: string;
  title?: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
  }>;
}

interface ChatKitSessionResponse {
  client_secret: string;
}

interface ChatResponse {
  conversation_id: string;
  assistant_message: string;
  tool_calls: Array<any>; // Tool call details
  created_at: string;
}

/**
 * Get the user's last conversation
 */
export async function getLastConversation(userId: string): Promise<LastConversationResponse> {
  try {
    // Try to get from localStorage first for immediate UI feedback
    const cachedLastConversation = localStorage.getItem(`last-conversation-${userId}`);
    if (cachedLastConversation) {
      try {
        const cached = JSON.parse(cachedLastConversation);
        if (cached.conversationId) {
          return {
            conversation_id: cached.conversationId,
            title: cached.title,
            updated_at: cached.lastActivity
          };
        }
      } catch (parseError) {
        console.error('Failed to parse cached conversation:', parseError);
      }
    }

    // Fallback to fetching from backend
    // For now, return an empty response
    return { conversation_id: '' };
  } catch (error) {
    console.error('Error getting last conversation:', error);
    throw error;
  }
}

/**
 * Send a message to the backend
 */
export async function sendMessage(userId: string, message: string, conversationId?: string): Promise<ChatResponse> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const requestBody: SendMessageRequest = {
      message,
      conversation_id: conversationId
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Update the user's last conversation
 */
export async function updateLastConversation(userId: string, conversationId: string): Promise<void> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/last-conversation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ conversation_id: conversationId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating last conversation:', error);
    throw error;
  }
}

/**
 * Get all user conversations
 */
export async function getUserConversations(userId: string): Promise<UserConversationsResponse> {
  try {
    const conversations = await fetchBackendUserConversations(userId);

    return {
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }))
    };
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(userId: string, conversationId: string): Promise<GetConversationResponse> {
  try {
    const conversation = await fetchBackendConversation(userId, conversationId);

    // For now, return basic structure
    // In a real implementation, this would fetch the conversation messages from the backend
    return {
      id: conversation.id,
      title: conversation.title,
      messages: [] // This would come from the backend in a real implementation
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

/**
 * Refresh ChatKit session
 */
export async function refreshChatKitSession(existingToken: string): Promise<ChatKitSessionResponse> {
  // In a real implementation, this would refresh the ChatKit session with the backend
  // For now, return a mock response
  return { client_secret: existingToken };
}

/**
 * Create a new ChatKit session
 */
export async function createChatKitSession(): Promise<ChatKitSessionResponse> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chatkit/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: ChatKitSessionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating ChatKit session:', error);
    throw error;
  }
}

// Export the adapter object
export const chatApiAdapter = {
  getLastConversation,
  sendMessage,
  updateLastConversation,
  getUserConversations,
  getConversation,
  refreshChatKitSession,
  createChatKitSession
};