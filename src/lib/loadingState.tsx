/**
 * Loading and state management utilities for ChatKit integration
 *
 * This module provides utilities for managing loading states, UI states,
 * and user feedback during ChatKit operations.
 */

import { useState, useEffect, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100 percentage
  message: string;
  error?: string;
}

export interface ChatState {
  isConnected: boolean;
  isActive: boolean;
  hasError: boolean;
  lastActivity: Date | null;
}

/**
 * Custom hook for managing loading states
 */
export const useLoadingState = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: ''
  });

  const startLoading = useCallback((message: string = 'Loading...') => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      message
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      progress: 100,
      message: 'Completed'
    });
  }, []);

  const setError = useCallback((error: string) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      error
    }));
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      progress: 0,
      message: ''
    });
  }, []);

  return {
    loadingState,
    startLoading,
    updateProgress,
    stopLoading,
    setError,
    reset
  };
};

/**
 * Custom hook for managing chat states
 */
export const useChatState = () => {
  const [chatState, setChatState] = useState<ChatState>({
    isConnected: false,
    isActive: false,
    hasError: false,
    lastActivity: null
  });

  const connect = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isConnected: true,
      hasError: false,
      lastActivity: new Date()
    }));
  }, []);

  const disconnect = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isConnected: false,
      isActive: false,
      lastActivity: new Date()
    }));
  }, []);

  const activate = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isActive: true,
      lastActivity: new Date()
    }));
  }, []);

  const deactivate = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isActive: false,
      lastActivity: new Date()
    }));
  }, []);

  const setErrorState = useCallback((hasError: boolean = true) => {
    setChatState(prev => ({
      ...prev,
      hasError,
      lastActivity: new Date()
    }));
  }, []);

  const updateActivity = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      lastActivity: new Date()
    }));
  }, []);

  return {
    chatState,
    connect,
    disconnect,
    activate,
    deactivate,
    setErrorState,
    updateActivity
  };
};

/**
 * Loading indicator component for ChatKit
 */
export const ChatKitLoadingIndicator = ({
  loadingState
}: {
  loadingState: LoadingState
}) => {
  if (!loadingState.isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-lg font-medium text-gray-800">{loadingState.message}</span>
        </div>
        {loadingState.progress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingState.progress}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-600 mt-1">
              {loadingState.progress}%
            </div>
          </div>
        )}
        {loadingState.error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            Error: {loadingState.error}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Connection status indicator for ChatKit
 */
export const ChatKitConnectionStatus = ({
  isConnected,
  isActive
}: {
  isConnected: boolean;
  isActive: boolean
}) => {
  let statusColor = 'gray';
  let statusText = 'Connecting...';

  if (isConnected) {
    statusColor = isActive ? 'green' : 'yellow';
    statusText = isActive ? 'Active' : 'Connected';
  } else {
    statusColor = 'red';
    statusText = 'Disconnected';
  }

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="flex items-center text-sm">
      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${colorClasses[statusColor as keyof typeof colorClasses]}`}></span>
      <span>{statusText}</span>
    </div>
  );
};

/**
 * Utility function to simulate loading with progress
 */
export const simulateLoading = async (
  duration: number,
  onProgress: (progress: number, message: string) => void
): Promise<void> => {
  const interval = 100;
  const steps = duration / interval;
  let progress = 0;

  for (let i = 0; i <= steps; i++) {
    progress = Math.min(100, Math.floor((i / steps) * 100));
    onProgress(progress, `Loading... ${progress}%`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

/**
 * Debounce utility for chat operations
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle utility for limiting chat operations
 */
export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<F>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};