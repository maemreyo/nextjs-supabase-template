// Client-side API request helper
import { apiLogger } from '@/services/logger';

export class ApiClient {
  private static async getHeaders(): Promise<Record<string, string>> {
    // Import dynamically to avoid hook usage issues
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  }

  static async get<T = any>(url: string, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders();
    
    apiLogger.start('API GET request', { url, hasOptions: !!options });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status} ${response.statusText}`;
      apiLogger.error('API GET failed', { url, status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    apiLogger.success('API GET success', { url, status: response.status });
    return data;
  }

  static async post<T = any>(url: string, data?: any, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders();
    
    apiLogger.start('API POST request', { url, hasData: !!data, hasOptions: !!options });
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status} ${response.statusText}`;
      apiLogger.error('API POST failed', { url, status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    apiLogger.success('API POST success', { url, status: response.status });
    return responseData;
  }

  static async patch<T = any>(url: string, data?: any, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders();
    
    apiLogger.start('API PATCH request', { url, hasData: !!data, hasOptions: !!options });
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status} ${response.statusText}`;
      apiLogger.error('API PATCH failed', { url, status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    apiLogger.success('API PATCH success', { url, status: response.status });
    return responseData;
  }

  static async put<T = any>(url: string, data?: any, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders();
    
    apiLogger.start('API PUT request', { url, hasData: !!data, hasOptions: !!options });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status} ${response.statusText}`;
      apiLogger.error('API PUT failed', { url, status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    apiLogger.success('API PUT success', { url, status: response.status });
    return responseData;
  }

  static async delete<T = any>(url: string, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders();
    
    apiLogger.start('API DELETE request', { url, hasOptions: !!options });
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status} ${response.statusText}`;
      apiLogger.error('API DELETE failed', { url, status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    apiLogger.success('API DELETE success', { url, status: response.status });
    return responseData;
  }
}

// Specific API endpoints for better type safety
export const api = {
  // Sessions
  sessions: {
    list: (params?: any) => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      return ApiClient.get(`/api/sessions/list${queryString}`);
    },
    
    // Deprecated: Use getDetail and getAnalyses instead
    get: (id: string, params?: any) => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      return ApiClient.get(`/api/sessions/${id}/load${queryString}`);
    },
    
    // New fast endpoint for session details only
    getDetail: (id: string) => {
      return ApiClient.get(`/api/sessions/${id}/detail`);
    },
    
    // New endpoint for session analyses with pagination
    getAnalyses: (id: string, params?: { limit?: number; offset?: number; type?: string; sort?: string; order?: 'asc' | 'desc' }) => {
      const queryParams: Record<string, string> = {};
      
      if (params?.limit !== undefined) {
        queryParams.limit = params.limit.toString();
      }
      
      if (params?.offset !== undefined) {
        queryParams.offset = params.offset.toString();
      }
      
      if (params?.type !== undefined) {
        queryParams.type = params.type;
      }
      
      if (params?.sort !== undefined) {
        queryParams.sort = params.sort;
      }
      
      if (params?.order !== undefined) {
        queryParams.order = params.order;
      }
      
      const queryString = Object.keys(queryParams).length > 0
        ? `?${new URLSearchParams(queryParams).toString()}`
        : '';
      
      const url = `/api/sessions/${id}/analyses${queryString}`;
      return ApiClient.get(url);
    },
    
    create: (data: any) => ApiClient.post('/api/sessions', data),
    
    update: (id: string, data: any) => ApiClient.patch(`/api/sessions/${id}`, data),
    
    delete: (id: string) => ApiClient.delete(`/api/sessions/${id}`),
    
    getContent: (id: string) => ApiClient.get(`/api/sessions/${id}/content`),
    
    updateContent: (id: string, data: any) => ApiClient.patch(`/api/sessions/${id}/content`, data),
  },

  // Analyses
  analyses: {
    save: (data: any) => ApiClient.post('/api/analyses/save', data),
    
    get: (id: string) => ApiClient.get(`/api/analyses/${id}`),
    
    detail: (id: string, options?: { params?: Record<string, string> }) => {
      const queryString = options?.params
        ? `?${new URLSearchParams(options.params).toString()}`
        : '';
      return ApiClient.get(`/api/analyses/${id}${queryString}`);
    },
    
    list: (params?: any) => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      return ApiClient.get(`/api/analyses/list${queryString}`);
    },
  },

  // AI
  ai: {
    analyzeWord: (word: string) => ApiClient.post('/api/ai/analyze-word', { word }),
    
    analyzeSentence: (sentence: string) => ApiClient.post('/api/ai/analyze-sentence', { sentence }),
    
    analyzeParagraph: (paragraph: string) => ApiClient.post('/api/ai/analyze-paragraph', { paragraph }),
    
    generateText: (params: any) => ApiClient.post('/api/ai/generate-text', params),
    
    checkUsage: () => ApiClient.get('/api/ai/check-usage'),
  },

  // Vocabulary
  vocabulary: {
    words: {
      list: (params?: any) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return ApiClient.get(`/api/vocabulary/words${queryString}`);
      },
      
      create: (data: any) => ApiClient.post('/api/vocabulary/words', data),
      
      get: (id: string) => ApiClient.get(`/api/vocabulary/words/${id}`),
      
      update: (id: string, data: any) => ApiClient.patch(`/api/vocabulary/words/${id}`, data),
      
      delete: (id: string) => ApiClient.delete(`/api/vocabulary/words/${id}`),
    },

    collections: {
      list: (params?: any) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return ApiClient.get(`/api/vocabulary/collections${queryString}`);
      },
      
      create: (data: any) => ApiClient.post('/api/vocabulary/collections', data),
      
      get: (id: string) => ApiClient.get(`/api/vocabulary/collections/${id}`),
      
      update: (id: string, data: any) => ApiClient.patch(`/api/vocabulary/collections/${id}`, data),
      
      delete: (id: string) => ApiClient.delete(`/api/vocabulary/collections/${id}`),
    },
  },
};