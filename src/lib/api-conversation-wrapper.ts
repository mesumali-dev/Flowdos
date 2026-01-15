/**
 * API call wrapper to fetch user's conversations from backend `/api/{user_id}/conversations`.
 *
 * This service provides methods to interact with the backend conversations API
 * and manage conversation data for the ChatKit integration.
 */

import { getToken } from './auth-helper';

/**
 * Interface for conversation data from the backend
 */
export interface BackendConversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  message_count?: number;
}

/**
 * Interface for the response from the conversations API
 */
export interface ConversationsResponse {
  conversations: BackendConversation[];
}

/**
 * Fetch all conversations for a user from the backend
 * @param userId The user ID to fetch conversations for
 * @returns Promise resolving to array of conversations
 */
export async function fetchUserConversations(userId: string): Promise<BackendConversation[]> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: ConversationsResponse = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    throw error;
  }
}

/**
 * Fetch a specific conversation by ID
 * @param userId The user ID
 * @param conversationId The conversation ID to fetch
 * @returns Promise resolving to the conversation data
 */
export async function fetchConversation(userId: string, conversationId: string): Promise<BackendConversation> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendConversation = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

/**
 * Create a new conversation
 * @param userId The user ID
 * @param title Optional title for the conversation
 * @returns Promise resolving to the new conversation data
 */
export async function createConversation(userId: string, title?: string): Promise<BackendConversation> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendConversation = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Update a conversation
 * @param userId The user ID
 * @param conversationId The conversation ID to update
 * @param updates The updates to apply
 * @returns Promise resolving to the updated conversation data
 */
export async function updateConversation(userId: string, conversationId: string, updates: Partial<BackendConversation>): Promise<BackendConversation> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/conversations/${conversationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: BackendConversation = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}

/**
 * Delete a conversation
 * @param userId The user ID
 * @param conversationId The conversation ID to delete
 * @returns Promise resolving when the conversation is deleted
 */
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/${userId}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}