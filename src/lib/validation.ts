/**
 * Data validation utilities for ChatKit integration
 *
 * This module provides validation functions to ensure data conforms to
 * the API contract requirements and prevent invalid data from being sent
 * to the backend.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validates a message string according to API contract requirements
 */
export const validateMessage = (message: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if message is empty
  if (!message || message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }

  // Check message length (max 4000 chars as per API contract)
  if (message.length > 4000) {
    errors.push(`Message exceeds maximum length of 4000 characters (${message.length} characters)`);
  }

  // Check for potentially harmful content (basic sanitization)
  if (/[<>'"&]/.test(message)) {
    warnings.push('Message contains special characters that may be sanitized by the server');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Validates a conversation ID
 */
export const validateConversationId = (id: string | null): ValidationResult => {
  const errors: string[] = [];

  if (id === null) {
    // Null is acceptable for new conversations
    return {
      isValid: true,
      errors: []
    };
  }

  if (!id || typeof id !== 'string') {
    errors.push('Conversation ID must be a valid string or null');
  } else if (id.length > 100) {
    errors.push('Conversation ID exceeds maximum length of 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates user ID format
 */
export const validateUserId = (userId: string): ValidationResult => {
  const errors: string[] = [];

  if (!userId || typeof userId !== 'string') {
    errors.push('User ID must be a valid string');
  } else if (userId.length > 100) {
    errors.push('User ID exceeds maximum length of 100 characters');
  }

  // Basic UUID format check (could be enhanced based on actual requirements)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    errors.push('User ID must be a valid UUID format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates metadata object
 */
export const validateMetadata = (metadata: any): ValidationResult => {
  const errors: string[] = [];

  if (metadata === null || metadata === undefined) {
    return {
      isValid: true,
      errors: []
    };
  }

  if (typeof metadata !== 'object') {
    errors.push('Metadata must be an object');
    return {
      isValid: false,
      errors
    };
  }

  // Check if metadata is too large (prevent excessive payload)
  const metadataSize = JSON.stringify(metadata).length;
  if (metadataSize > 10000) { // 10KB limit
    errors.push(`Metadata exceeds maximum size of 10KB (${metadataSize} characters)`);
  }

  // Validate that metadata doesn't contain potentially harmful keys
  const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];
  for (const key of forbiddenKeys) {
    if (key in metadata) {
      errors.push(`Metadata cannot contain '${key}' key`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a complete chat request
 */
export const validateChatRequest = (request: {
  message: string;
  conversation_id?: string | null;
  metadata?: any;
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate message
  const messageValidation = validateMessage(request.message);
  if (!messageValidation.isValid) {
    errors.push(...messageValidation.errors);
    if (messageValidation.warnings) {
      warnings.push(...messageValidation.warnings);
    }
  }

  // Validate conversation ID if provided
  if (request.conversation_id !== undefined) {
    const conversationValidation = validateConversationId(request.conversation_id);
    if (!conversationValidation.isValid) {
      errors.push(...conversationValidation.errors);
    }
  }

  // Validate metadata if provided
  if (request.metadata !== undefined) {
    const metadataValidation = validateMetadata(request.metadata);
    if (!metadataValidation.isValid) {
      errors.push(...metadataValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Sanitizes a message string to remove potentially harmful content
 */
export const sanitizeMessage = (message: string): string => {
  // Remove potentially dangerous characters
  let sanitized = message.replace(/[<>]/g, '');

  // Escape quotes and ampersands for safe transmission
  sanitized = sanitized.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/&/g, '&amp;');

  return sanitized;
};

/**
 * Validates that a response from the backend is properly formatted
 */
export const validateChatResponse = (response: any): ValidationResult => {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    errors.push('Response must be an object');
    return {
      isValid: false,
      errors
    };
  }

  // Check required fields in response
  if (!response.hasOwnProperty('conversation_id')) {
    errors.push('Response must include conversation_id');
  }

  if (!response.hasOwnProperty('response') && !response.hasOwnProperty('message')) {
    errors.push('Response must include response or message field');
  }

  if (!response.hasOwnProperty('status')) {
    errors.push('Response must include status field');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates API endpoint parameters
 */
export const validateApiEndpoint = (userId: string, endpoint: string): ValidationResult => {
  const errors: string[] = [];

  // Validate user ID
  const userIdValidation = validateUserId(userId);
  if (!userIdValidation.isValid) {
    errors.push(...userIdValidation.errors);
  }

  // Validate endpoint format
  if (!endpoint || typeof endpoint !== 'string') {
    errors.push('Endpoint must be a valid string');
  } else if (!endpoint.startsWith('/')) {
    errors.push('Endpoint must start with "/"');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Creates a validation error response in the expected API format
 */
export const createValidationError = (errors: string[]): { error: { type: string; message: string; details: any } } => {
  return {
    error: {
      type: 'validation',
      message: 'Validation failed',
      details: {
        errors,
        timestamp: new Date().toISOString()
      }
    }
  };
};

/**
 * Utility to validate and sanitize input before sending to API
 */
export const prepareChatRequest = (request: {
  message: string;
  conversation_id?: string | null;
  metadata?: any;
}): { request: any; validation: ValidationResult } => {
  // First validate the request
  const validation = validateChatRequest(request);

  if (!validation.isValid) {
    return { request, validation };
  }

  // If validation passes, sanitize the message
  const sanitizedRequest = {
    ...request,
    message: sanitizeMessage(request.message)
  };

  return { request: sanitizedRequest, validation };
};