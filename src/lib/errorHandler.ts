/**
 * Error handling utilities for ChatKit integration
 *
 * This module provides centralized error handling for ChatKit-related operations,
 * including API communication errors, authentication failures, and network issues.
 */

export interface ChatKitError {
  type: 'authentication' | 'network' | 'validation' | 'server' | 'unknown';
  message: string;
  status?: number;
  details?: any;
}

/**
 * Creates a standardized error object for ChatKit operations
 */
export const createChatKitError = (
  type: ChatKitError['type'],
  message: string,
  status?: number,
  details?: any
): ChatKitError => {
  return {
    type,
    message,
    status,
    details
  };
};

/**
 * Handles and categorizes errors from ChatKit operations
 */
export const handleChatKitError = (error: any): ChatKitError => {
  // If it's already a ChatKitError, return as-is
  if (error.type && error.message) {
    return error;
  }

  // Network errors (fetch failures, connection issues)
  if (error.name === 'TypeError' || error.message.includes('fetch')) {
    return createChatKitError(
      'network',
      'Network connection failed. Please check your internet connection.',
      undefined,
      error
    );
  }

  // HTTP status errors
  if (error.status) {
    switch (error.status) {
      case 401:
        return createChatKitError(
          'authentication',
          'Authentication required. Please sign in to continue.',
          401,
          error
        );
      case 403:
        return createChatKitError(
          'authentication',
          'Access denied. Please verify your permissions.',
          403,
          error
        );
      case 422:
        return createChatKitError(
          'validation',
          'Invalid request data. Please check your input.',
          422,
          error
        );
      case 429:
        return createChatKitError(
          'server',
          'Rate limit exceeded. Please try again later.',
          429,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return createChatKitError(
          'server',
          'Service temporarily unavailable. Please try again later.',
          error.status,
          error
        );
      default:
        return createChatKitError(
          'server',
          `Server error (${error.status}). Please try again.`,
          error.status,
          error
        );
    }
  }

  // Default error
  return createChatKitError(
    'unknown',
    'An unexpected error occurred. Please try again.',
    undefined,
    error
  );
};

/**
 * Formats error messages for display to users
 */
export const formatErrorMessage = (error: ChatKitError): string => {
  switch (error.type) {
    case 'authentication':
      return error.message;
    case 'network':
      return error.message;
    case 'validation':
      return `Validation error: ${error.message}`;
    case 'server':
      return `Service error: ${error.message}`;
    case 'unknown':
    default:
      return `Error: ${error.message}`;
  }
};

/**
 * Error boundary component for ChatKit components
 */
export class ChatKitErrorBoundary {
  private onErrorCallback?: (error: ChatKitError) => void;

  constructor(onError?: (error: ChatKitError) => void) {
    this.onErrorCallback = onError;
  }

  /**
   * Executes a function and catches any errors, converting them to ChatKitErrors
   */
  async execute<T>(fn: () => Promise<T>): Promise<{ success: true; data: T } | { success: false; error: ChatKitError }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (rawError) {
      const error = handleChatKitError(rawError);

      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }

      return { success: false, error };
    }
  }

  /**
   * Sets the callback to handle errors
   */
  onError(callback: (error: ChatKitError) => void) {
    this.onErrorCallback = callback;
  }
}

/**
 * Validates API responses and handles potential errors
 */
export const validateApiResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody.error?.message || errorBody.detail || `HTTP ${response.status}: ${response.statusText}`;

    throw createChatKitError(
      'server',
      errorMessage,
      response.status,
      errorBody
    );
  }

  return response.json();
};

/**
 * Type guard to check if an object is a ChatKitError
 */
export const isChatKitError = (obj: any): obj is ChatKitError => {
  return obj && typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         typeof obj.message === 'string';
};