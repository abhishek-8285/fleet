import { useCallback, useState } from 'react';
import { ApiError, getErrorDisplayMessage } from '../api';

interface ErrorState {
  error: ApiError | Error | string | null;
  isLoading: boolean;
  retryCount: number;
}

interface UseErrorHandlerReturn {
  error: ErrorState['error'];
  isLoading: boolean;
  retryCount: number;
  handleError: (error: any) => void;
  clearError: () => void;
  retry: () => void;
  executeWithErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ) => Promise<T | null>;
}

export function useErrorHandler(
  onError?: (error: any) => void,
  maxRetries = 3
): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0
  });

  const handleError = useCallback((error: any) => {
    console.error('🚨 useErrorHandler caught error:', error);
    
    setErrorState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));

    // Call custom error handler if provided
    onError?.(error);

    // Show user-friendly error message (could integrate with toast library)
    const message = getErrorDisplayMessage(error);
    console.error('Error message for user:', message);
    
    // In production, report to error monitoring
    if (process.env.NODE_ENV === 'production') {
      reportToMonitoring(error);
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      error: null,
      retryCount: 0
    }));
  }, []);

  const retry = useCallback(() => {
    if (errorState.retryCount < maxRetries) {
      setErrorState(prev => ({
        error: null,
        isLoading: false,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [errorState.retryCount, maxRetries]);

  const executeWithErrorHandling = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      setErrorState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await asyncFn();
      
      setErrorState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      handleError(error);
      return null;
    }
  }, [handleError]);

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    retryCount: errorState.retryCount,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling
  };
}

// Report error to monitoring service
const reportToMonitoring = (error: any) => {
  // In production, integrate with error monitoring service
  console.log('📊 Reporting error to monitoring service:', {
    message: getErrorDisplayMessage(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
};

// Hook for API call error handling
export function useApiErrorHandler() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const executeApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: ApiError) => void;
      loadingMessage?: string;
    }
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      
      options?.onError?.(apiError);
      console.error('API call failed:', apiError);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    executeApiCall,
    clearError,
    hasError: !!error,
    errorMessage: error ? getErrorDisplayMessage(error) : null
  };
}

// Hook for component-level error boundaries
export function useComponentError() {
  const [componentError, setComponentError] = useState<Error | null>(null);

  const captureError = useCallback((error: Error, errorInfo?: any) => {
    console.error('Component error captured:', error, errorInfo);
    setComponentError(error);
    
    // Report to monitoring
    if (process.env.NODE_ENV === 'production') {
      reportToMonitoring({ ...error, errorInfo });
    }
  }, []);

  const clearComponentError = useCallback(() => {
    setComponentError(null);
  }, []);

  return {
    componentError,
    hasComponentError: !!componentError,
    captureError,
    clearComponentError
  };
}



