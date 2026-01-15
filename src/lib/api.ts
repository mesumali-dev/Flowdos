/**
 * API Client for Backend Communication
 *
 * This module provides an API client for communicating with the FastAPI backend.
 * All authenticated requests include JWT token in Authorization header.
 *
 * Security Notes:
 * - JWT tokens stored in localStorage
 * - 401 responses trigger redirect to login
 * - Never expose sensitive data in URLs
 *
 * @see specs/003-backend-auth-refactor
 */

import {
  clearAuth,
  getToken,
  storeAuth,
  StoredUser,
} from "./auth-helper";

// API base URL from environment
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * API response type
 */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Auth response from backend
 */
interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Handle 401 Unauthorized response
 * Clears auth state and redirects user to login page
 */
function handleUnauthorized(): void {
  clearAuth();
  if (typeof window !== "undefined") {
    // Get current path for redirect after login
    const currentPath = window.location.pathname;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}

/**
 * Make authenticated API request
 *
 * Automatically attaches JWT token to Authorization header.
 * Handles 401 responses by clearing auth and redirecting to login.
 *
 * @param endpoint - API endpoint (e.g., "/api/auth/verify")
 * @param options - Fetch options
 * @returns API response with data or error
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get JWT token for authenticated requests
    const token = getToken();

    // Build headers with authentication
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      handleUnauthorized();
      return {
        data: null,
        error: "Unauthorized - Please log in again",
        status: 401,
      };
    }

    // Handle other error responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      return {
        data: null,
        error: errorMessage,
        status: response.status,
      };
    }

    // Parse successful response
    const data = await response.json();
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 0,
    };
  }
}

/**
 * Register a new user
 *
 * @param name - User's display name
 * @param email - User's email address
 * @param password - User's password (minimum 8 characters)
 * @returns API response with auth data or error
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  // Store auth data on success
  if (response.data) {
    storeAuth(response.data.access_token, response.data.user);
  }

  return response;
}

/**
 * Login with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns API response with auth data or error
 */
export async function login(
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Store auth data on success
  if (response.data) {
    storeAuth(response.data.access_token, response.data.user);
  }

  return response;
}

/**
 * Logout - clear auth data
 */
export function logout(): void {
  clearAuth();
}

/**
 * Health check API call (unauthenticated)
 */
export async function healthCheck(): Promise<
  ApiResponse<{
    status: string;
    timestamp: string;
    service: string;
    version: string;
  }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 0,
    };
  }
}

/**
 * Verify authentication with backend
 * Calls the /api/auth/verify endpoint
 */
export async function verifyAuth(): Promise<
  ApiResponse<{
    authenticated: boolean;
    user_id: string;
    email: string;
  }>
> {
  return apiRequest("/api/auth/verify");
}

// =============================================================================
// Task API Types and Methods
// @see specs/004-task-crud/contracts/openapi.yaml
// =============================================================================

/**
 * Task response from backend
 */
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Task list response from backend
 */
export interface TaskListResponse {
  tasks: Task[];
  count: number;
}

/**
 * Task create request
 */
export interface TaskCreateRequest {
  title: string;
  description?: string | null;
}

/**
 * Task update request
 */
export interface TaskUpdateRequest {
  title?: string;
  description?: string | null;
}

/**
 * Get all tasks for a user
 *
 * @param userId - User ID from authentication
 * @returns API response with task list
 */
export async function getTasks(
  userId: string
): Promise<ApiResponse<TaskListResponse>> {
  return apiRequest<TaskListResponse>(`/api/${userId}/tasks`);
}

/**
 * Get a single task by ID
 *
 * @param userId - User ID from authentication
 * @param taskId - Task ID to retrieve
 * @returns API response with task data
 */
export async function getTask(
  userId: string,
  taskId: string
): Promise<ApiResponse<Task>> {
  return apiRequest<Task>(`/api/${userId}/tasks/${taskId}`);
}

/**
 * Create a new task
 *
 * @param userId - User ID from authentication
 * @param task - Task creation data
 * @returns API response with created task
 */
export async function createTask(
  userId: string,
  task: TaskCreateRequest
): Promise<ApiResponse<Task>> {
  return apiRequest<Task>(`/api/${userId}/tasks`, {
    method: "POST",
    body: JSON.stringify(task),
  });
}

/**
 * Update a task
 *
 * @param userId - User ID from authentication
 * @param taskId - Task ID to update
 * @param task - Task update data
 * @returns API response with updated task
 */
export async function updateTask(
  userId: string,
  taskId: string,
  task: TaskUpdateRequest
): Promise<ApiResponse<Task>> {
  return apiRequest<Task>(`/api/${userId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
}

/**
 * Delete a task
 *
 * @param userId - User ID from authentication
 * @param taskId - Task ID to delete
 * @returns API response (no content on success)
 */
export async function deleteTask(
  userId: string,
  taskId: string
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/${userId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

/**
 * Toggle task completion status
 *
 * @param userId - User ID from authentication
 * @param taskId - Task ID to toggle
 * @returns API response with updated task
 */
export async function toggleTaskComplete(
  userId: string,
  taskId: string
): Promise<ApiResponse<Task>> {
  return apiRequest<Task>(`/api/${userId}/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
}

// =============================================================================
// ChatKit API Methods
// @see specs/010-chatkit-integration/contracts/api-contracts.md
// =============================================================================

/**
 * Conversation summary interface for thread list
 */
export interface ConversationSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Conversation detail interface
 */
export interface ConversationDetail {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/**
 * Message item interface
 */
export interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/**
 * Response interface for conversation list
 */
export interface GetConversationsResponse {
  conversations: ConversationSummary[];
  count: number;
  has_more: boolean;
}

/**
 * Response interface for conversation messages
 */
export interface GetMessagesResponse {
  messages: MessageItem[];
  count: number;
  has_more: boolean;
}

/**
 * Chat request interface for the existing backend API
 */
export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

/**
 * Tool call interface for chat responses
 */
export interface ToolCall {
  tool_name: string;
  parameters: Record<string, any>;
  result: Record<string, any> | null;
  success: boolean;
}

/**
 * Chat response interface from the existing backend API
 */
export interface ChatResponse {
  conversation_id: string;
  assistant_message: string;
  tool_calls: ToolCall[];
  created_at: string;
}

/**
 * Send a chat message to the backend API
 */
export async function sendChatMessage(
  userId: string,
  request: ChatRequest
): Promise<ApiResponse<ChatResponse>> {
  return apiRequest<ChatResponse>(`/api/${userId}/chat`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get the last conversation for a user
 */
export async function getLastConversation(
  userId: string
): Promise<ApiResponse<{
  conversation_id: string | null;
  title?: string;
  last_message?: string;
  updated_at?: string;
}>> {
  return apiRequest(`/api/${userId}/last-conversation`);
}

/**
 * Update the last conversation for a user
 */
export async function updateLastConversation(
  userId: string,
  conversationId: string
): Promise<ApiResponse<{ success: boolean; conversation_id: string }>> {
  return apiRequest(`/api/${userId}/update-last-conversation`, {
    method: 'POST',
    body: JSON.stringify({ conversation_id: conversationId }),
  });
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string
): Promise<ApiResponse<{
  conversations: Array<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>;
  count: number;
}>> {
  return apiRequest(`/api/${userId}/conversations`);
}

/**
 * Get all conversations for a user with pagination and sorting
 */
export async function getUserConversationsWithParams(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  sort: string = "updated_desc"
): Promise<ApiResponse<GetConversationsResponse>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    sort,
  });
  return apiRequest<GetConversationsResponse>(
    `/api/${userId}/conversations?${params}`
  );
}

/**
 * Create a ChatKit session with the backend
 */
export async function createChatKitSession(
  userId: string
): Promise<ApiResponse<{
  client_secret: string;
  session_id: string;
  user_id: string;
}>> {
  return apiRequest('/api/chatkit/session', {
    method: 'POST',
  });
}

/**
 * Refresh a ChatKit session
 */
export async function refreshChatKitSession(
  token: string
): Promise<ApiResponse<{
  client_secret: string;
  session_id: string;
  expires_at: string;
}>> {
  return apiRequest('/api/chatkit/refresh', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// =============================================================================
// Modern Conversation API Methods
// =============================================================================

/**
 * Get all conversations for a user with pagination and sorting
 */
/**
 * Get a specific conversation by ID
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<ApiResponse<ConversationDetail>> {
  return apiRequest<ConversationDetail>(
    `/api/${userId}/conversations/${conversationId}`
  );
}

/**
 * Get a specific conversation with its messages
 */
export async function getConversationWithMessages(
  userId: string,
  conversationId: string
): Promise<ApiResponse<{
  conversation: ConversationDetail;
  messages: MessageItem[];
}>> {
  return apiRequest(`/api/${userId}/conversations/${conversationId}`);
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<ApiResponse<ConversationDetail>> {
  return apiRequest<ConversationDetail>(`/api/${userId}/conversations`, {
    method: 'POST',
    body: JSON.stringify({ title: title || null }),
  });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/${userId}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}
