/**
 * API client utility for chat endpoint integration
 */

import { getStoredUser, getToken } from '@/lib/auth-helper';

interface ChatRequest {
  message: string;
  conversation_id?: string; // Optional for new conversations
}

interface ChatResponse {
  conversation_id: string;
  assistant_message: string;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

interface ChatAPIOptions {
  baseUrl?: string;
}

class ChatAPIClient {
  private baseUrl: string;

  constructor(options: ChatAPIOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Send a message to the chat endpoint
   * @param userId - User ID to send the message for
   * @param request - Chat request containing message and optional conversation_id
   * @returns Promise resolving to ChatResponse
   */
  async sendMessage(userId: string, request: ChatRequest): Promise<ChatResponse> {
    // Get JWT token from existing auth system
    const token = getToken() || '';

    const response = await fetch(`${this.baseUrl}/api/${userId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  }
}

export { ChatAPIClient };
export type { ChatRequest, ChatResponse };