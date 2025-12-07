const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

// Enhanced error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: string;
  retryable: boolean;
  context?: string;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Retryable HTTP status codes
  backoffMultiplier: 2 // Exponential backoff
};

// Create enhanced error object
const createApiError = (response: Response, context?: string, originalError?: any): ApiError => {
  const status = response.status;
  const isRetryable = RETRY_CONFIG.retryableStatuses.includes(status);
  
  return {
    message: getErrorMessage(response, originalError),
    status,
    code: response.headers.get('x-error-code') || 'API_ERROR',
    details: { url: response.url, method: context },
    timestamp: new Date().toISOString(),
    retryable: isRetryable,
    context
  };
};

// Get user-friendly error message
const getErrorMessage = (response: Response, originalError?: any): string => {
  const status = response.status;
  
  // Default messages for common status codes
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please login again.',
    403: 'Access denied. You don\'t have permission for this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Internal server error. Please try again later.',
    502: 'Service temporarily unavailable. Please try again.',
    503: 'Service maintenance in progress. Please try again later.',
    504: 'Request timeout. Please try again.'
  };

  return statusMessages[status] || originalError?.message || `Request failed with status ${status}`;
};

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fetch with retry logic
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  context: string,
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If response is ok, return it
    if (response.ok) {
      return response;
    }

    // Handle 401 specifically for token refresh
    if (response.status === 401) {
      console.warn('🔑 Authentication failed, attempting token refresh...');
      if (await tryRefresh()) {
        // Retry with new token
        const newHeaders = { ...options.headers, ...authHeader() };
        const retryResponse = await fetch(url, { ...options, headers: newHeaders });
        if (retryResponse.ok) {
          return retryResponse;
        }
        // If retry with new token also fails, throw error
        throw createApiError(retryResponse, context);
      } else {
        // Token refresh failed, redirect to login
        console.error('🚫 Token refresh failed, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Let React Router handle navigation instead of hard redirect
        window.dispatchEvent(new CustomEvent('auth-failed'));
        throw createApiError(response, context);
      }
    }

    // For retryable errors, attempt retry
    const apiError = createApiError(response, context);
    if (apiError.retryable && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
      console.warn(`⏳ Retrying ${context} (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}) after ${delay}ms...`);
      
      await sleep(delay);
      return fetchWithRetry(url, options, context, retryCount + 1);
    }

    // Log error details
    console.error(`🚨 API Error [${context}]:`, {
      ...apiError,
      retryCount,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Report critical errors to monitoring service
    if (process.env.NODE_ENV === 'production' && response.status >= 500) {
      reportError(apiError);
    }

    throw apiError;

  } catch (error) {
    // Network errors, parsing errors, etc.
    if (error instanceof ApiError) {
      throw error; // Re-throw API errors
    }

    // Handle network/fetch errors
    const networkError: ApiError = {
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
      code: 'NETWORK_ERROR',
      details: { url, method: context },
      timestamp: new Date().toISOString(),
      retryable: true,
      context
    };

    // Retry network errors
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
      console.warn(`🔄 Retrying ${context} due to network error (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}) after ${delay}ms...`);
      
      await sleep(delay);
      return fetchWithRetry(url, options, context, retryCount + 1);
    }

    console.error(`🌐 Network Error [${context}]:`, networkError);
    throw networkError;
  }
}

// Report error to monitoring service
const reportError = (error: ApiError) => {
  // In production, send to error monitoring service like Sentry
  console.log('📊 Error reported to monitoring service:', error);
  // Example: Sentry.captureException(new Error(error.message), { extra: error });
};

// Enhanced API methods with better error handling
export async function apiGet<T>(path: string): Promise<T> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}${path}`, 
      { headers: authHeader() },
      `GET ${path}`
    );
    return await response.json();
  } catch (error) {
    // Add context for UI error handling
    if (error instanceof Error) {
      (error as any).endpoint = path;
      (error as any).method = 'GET';
    }
    throw error;
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      },
      `POST ${path}`
    );
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      (error as any).endpoint = path;
      (error as any).method = 'POST';
      (error as any).requestBody = body;
    }
    throw error;
  }
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}${path}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      },
      `PUT ${path}`
    );
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      (error as any).endpoint = path;
      (error as any).method = 'PUT';
      (error as any).requestBody = body;
    }
    throw error;
  }
}

export async function apiDelete(path: string): Promise<void> {
  try {
    await fetchWithRetry(
      `${API_BASE}${path}`,
      { method: 'DELETE', headers: authHeader() },
      `DELETE ${path}`
    );
  } catch (error) {
    if (error instanceof Error) {
      (error as any).endpoint = path;
      (error as any).method = 'DELETE';
    }
    throw error;
  }
}

// Utility function to check if error is retryable
export const isRetryableError = (error: any): boolean => {
  return error?.retryable === true;
};

// Utility function to get user-friendly error message
export const getErrorDisplayMessage = (error: any): string => {
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
};

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function tryRefresh(): Promise<boolean> {
  const rt = localStorage.getItem('refreshToken')
  if (!rt) return false
  
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ refreshToken: rt })
    })
    
    if (!res.ok) return false
    
    const json = await res.json()
    if (json.token) { 
      localStorage.setItem('token', json.token)
      console.log('✅ Token refreshed successfully')
      return true
    }
    return false
  } catch (error) {
    console.error('❌ Token refresh failed:', error)
    return false
  }
}

// Connection status checker
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch {
    return false;
  }
};

// API health check with detailed status
export const getApiHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<string, boolean>;
  responseTime: number;
}> => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'healthy',
        services: data.services || {},
        responseTime
      };
    } else {
      return {
        status: 'unhealthy',
        services: {},
        responseTime
      };
    }
  } catch {
    return {
      status: 'unhealthy', 
      services: {},
      responseTime: Date.now() - startTime
    };
  }
};