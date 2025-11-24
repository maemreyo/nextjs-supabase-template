# API Authentication Solution

## Vấn đề hiện tại

### 1. Code duplication trong API routes
Mỗi API route đều lặp lại cùng một logic authentication:

```typescript
// Lặp lại trong nhiều file
const authHeader = request.headers.get('authorization');
if (!authHeader) {
  return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
}

const supabase = await createClient();
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
}
```

### 2. Code duplication trong client-side hooks
Mỗi hook đều lặp lại logic tạo headers:

```typescript
// Lặp lại trong nhiều hooks
const token = await getAccessToken();
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### 3. Inconsistent authentication methods
- Hầu hết APIs dùng `request.headers.get('authorization')` và `supabase.auth.getUser(token)`
- Một số APIs như `generate-text/route.ts` dùng `supabase.auth.getUser()` trực tiếp

## Giải pháp đề xuất: API Client Pattern

### Server-side solution: `src/lib/api-client.ts`

#### 1. Authentication helper
```typescript
export async function authenticateRequest(request: Request): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const supabase = await createClient();
  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return { user, supabase };
}
```

#### 2. Response helpers
```typescript
export function createSuccessResponse<T>(data: T, meta?: any) {
  return Response.json({
    success: true,
    data,
    ...(meta && { meta })
  });
}

export function createErrorResponse(error: string, status: number = 500) {
  return Response.json({
    success: false,
    error
  }, { status });
}
```

#### 3. Higher-order function for authentication
```typescript
export function withAuth<T extends any[]>(
  handler: (request: any, context: { user: User; supabase: Awaited<ReturnType<typeof createClient>> } & Record<string, any>, ...args: T) => Promise<Response>
) {
  return async (request: any, context: Record<string, any>, ...args: T): Promise<Response> => {
    try {
      const { user, supabase } = await authenticateRequest(request);
      return await handler(request, { user, supabase, ...context }, ...args);
    } catch (error) {
      // Centralized error handling
      if (error instanceof Error) {
        if (error.message.includes('Authorization header required')) {
          return createErrorResponse(error.message, 401);
        }
        if (error.message.includes('Invalid or expired token')) {
          return createErrorResponse(error.message, 401);
        }
      }
      
      return createErrorResponse('Internal server error', 500);
    }
  };
}
```

#### 4. Refactored API route example
```typescript
// Trước khi refactor (391 dòng)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 20+ dòng authentication code lặp lại
  // ...
}

// Sau khi refactor (244 dòng)
export const PATCH = withAuth(
  async (request: NextRequest, { user, supabase }, { params }) => {
    // Business logic only
    // ...
  }
);
```

### Client-side solution: `src/lib/api-client-client.ts`

#### 1. API Client class
```typescript
export class ApiClient {
  private static async getHeaders(): Promise<Record<string, string>> {
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // ... POST, PATCH, PUT, DELETE methods
}
```

#### 2. Typed API endpoints
```typescript
export const api = {
  sessions: {
    list: (params?: any) => ApiClient.get(`/api/sessions/list${queryString}`),
    get: (id: string) => ApiClient.get(`/api/sessions/${id}/load`),
    create: (data: any) => ApiClient.post('/api/sessions', data),
    // ...
  },
  
  ai: {
    analyzeWord: (word: string) => ApiClient.post('/api/ai/analyze-word', { word }),
    analyzeSentence: (sentence: string) => ApiClient.post('/api/ai/analyze-sentence', { sentence }),
    // ...
  },
  
  // ... other endpoints
};
```

#### 3. Refactored hook example
```typescript
// Trước khi refactor
const queryFn: async () => {
  // Get access token for authentication
  const token = await getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token is available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/sessions/${sessionId}/load`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch session data: ${response.status} ${response.statusText}`
    );
  }

  // ...
}

// Sau khi refactor
const queryFn: async () => {
  // Use new API client instead of manual fetch
  const apiResponse = await api.sessions.get(sessionId);
  
  // Handle response
  // ...
}
```

## Lợi ích của giải pháp

### 1. Giảm code duplication
- **Server-side**: Authentication logic được centralize trong 1 function
- **Client-side**: Header creation logic được centralize trong ApiClient

### 2. Consistency
- Tất cả APIs dùng cùng authentication method
- Tất cả client calls dùng cùng error handling

### 3. Type safety
- API endpoints được định nghĩa với types cụ thể
- Response types được đảm bảo

### 4. Maintainability
- Logic authentication chỉ cần thay đổi ở 1 place
- Easy để add new features (logging, caching, etc.)

### 5. Error handling
- Centralized error handling
- Consistent error responses

## Migration plan

### Phase 1: Setup infrastructure
1. ✅ Create `src/lib/api-client.ts` (server-side)
2. ✅ Create `src/lib/api-client-client.ts` (client-side)
3. ⏳ Test with example routes and hooks

### Phase 2: Migrate critical APIs
1. ⏳ Refactor session APIs (most used)
2. ⏳ Refactor AI APIs
3. ⏳ Refactor vocabulary APIs

### Phase 3: Update hooks
1. ⏳ Update `useSessionData`
2. ⏳ Update `useSessions`
3. ⏳ Update other hooks

### Phase 4: Cleanup
1. ⏳ Remove old authentication code
2. ⏳ Update documentation
3. ⏳ Add tests

## Usage examples

### Server-side API route
```typescript
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';

export const GET = withAuth(
  async (request, { user, supabase }, { params }) => {
    // Your business logic here
    const data = await supabase
      .from('table')
      .select('*')
      .eq('user_id', user.id);
    
    return createSuccessResponse(data);
  }
);
```

### Client-side hook
```typescript
import { api } from '@/lib/api-client-client';

export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: () => api.myEndpoint.list({ limit: 10 }),
  });
}
```

## Conclusion

API Client pattern này giải quyết được các vấn đề chính:
1. **Code duplication** → Centralized logic
2. **Inconsistency** → Standardized approach
3. **Maintainability** → Single source of truth
4. **Type safety** → Better development experience

Giải pháp này có thể implement dần dần mà không breaking existing functionality.