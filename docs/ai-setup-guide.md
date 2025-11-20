# Hướng Dẫn Cấu Hình AI Module

Hướng dẫn toàn diện về thiết lập và sử dụng AI Module trong Next.js Supabase Template.

## 🧠 Tổng Quan AI Module

AI Module cung cấp:

- **Multi-Provider Support**: Tích hợp với nhiều AI providers (OpenAI, Anthropic, Google, Cohere)
- **Usage Tracking**: Theo dõi và monitoring chi tiết việc sử dụng AI
- **Smart Rate Limiting**: Rate limiting thông minh dựa trên user tiers và provider limits
- **Error Handling**: Xử lý lỗi robust với fallback strategies
- **Cost Management**: Quản lý chi phí với tracking và budget controls
- **Intelligent Caching**: Caching thông minh để cải thiện performance và giảm chi phí

## 🔧 Bước 1: Lấy API Keys

### OpenAI

1. **Truy cập [OpenAI Platform](https://platform.openai.com)**
2. **Đăng nhập** hoặc **đăng ký**
3. **Vào API Keys** trong sidebar
4. **Click "Create new secret key"**
5. **Đặt tên key** (ví dụ: "MyApp Production")
6. **Copy và lưu key** một cách an toàn

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Anthropic (Claude)

1. **Truy cập [Anthropic Console](https://console.anthropic.com)**
2. **Đăng nhập** hoặc **đăng ký**
3. **Vào API Keys**
4. **Click "Create Key"**
5. **Đặt tên key** và chọn usage tier
6. **Copy và lưu key**

```env
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

### Google AI (Gemini)

1. **Truy cập [Google AI Studio](https://aistudio.google.com)**
2. **Đăng nhập** với Google account
3. **Vào "Get API Key"**
4. **Tạo new API key** hoặc sử dụng existing
5. **Copy API key**

```env
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

### Cohere

1. **Truy cập [Cohere Dashboard](https://dashboard.cohere.com)**
2. **Đăng nhập** hoặc **đăng ký**
3. **Vào API Keys**
4. **Generate new API key**
5. **Copy và lưu key**

```env
COHERE_API_KEY=your-cohere-api-key-here
```

## 📝 Bước 2: Cấu Hình Environment Variables

### Cập Nhật .env.local

Mở file `.env.local` và thêm các AI API keys:

```env
# ==========================================
# AI PROVIDER CONFIGURATION
# ==========================================

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_ORGANIZATION=org-your-organization-id  # Optional

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Google AI Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# Cohere Configuration
COHERE_API_KEY=your-cohere-api-key-here

# ==========================================
# AI DEFAULT SETTINGS
# ==========================================

# Default provider và model
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-3.5-turbo

# Generation parameters
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
AI_TOP_P=1.0
AI_FREQUENCY_PENALTY=0.0
AI_PRESENCE_PENALTY=0.0

# ==========================================
# AI FEATURE CONFIGURATION
# ==========================================

# Usage tracking
AI_USAGE_TRACKING_ENABLED=true
AI_RATE_LIMITING_ENABLED=true
AI_CACHE_ENABLED=true

# Cache configuration
AI_CACHE_TTL=300000  # 5 minutes in milliseconds
AI_CACHE_MAX_SIZE=100
AI_CACHE_STRATEGY=lru  # lru, fifo, lfu

# Rate limiting
AI_RATE_LIMIT_REQUESTS_PER_MINUTE=60
AI_RATE_LIMIT_REQUESTS_PER_HOUR=1000
AI_RATE_LIMIT_REQUESTS_PER_DAY=10000
AI_RATE_LIMIT_TOKENS_PER_DAY=1000000
AI_RATE_LIMIT_COST_PER_DAY=100

# Fallback providers (comma-separated)
AI_FALLBACK_PROVIDERS=anthropic,google

# Error reporting
AI_ERROR_REPORTING_ENABLED=true
```

### Environment Variables cho Production

Tạo file `.env.production` cho production:

```env
# Production AI settings (more conservative)
AI_DEFAULT_MODEL=gpt-4o-mini
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.5

# Stricter rate limits for production
AI_RATE_LIMIT_REQUESTS_PER_MINUTE=30
AI_RATE_LIMIT_COST_PER_DAY=50

# Production API keys (different from dev)
OPENAI_API_KEY=sk-prod-your-production-key
ANTHROPIC_API_KEY=sk-ant-prod-your-production-key
```

## 🏗️ Bước 3: Cấu Hình Database cho Usage Tracking

### Tạo AI Usage Tables

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- AI Usage Logs Table
CREATE TABLE ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'cohere')),
  model TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('text-generation', 'embedding', 'image-generation', 'other')),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0.000001,
  duration INTEGER, -- milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User AI Tiers Table
CREATE TABLE user_ai_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier_name TEXT NOT NULL DEFAULT 'free',
  max_requests_per_day INTEGER DEFAULT 100,
  max_tokens_per_day INTEGER DEFAULT 10000,
  max_cost_per_day DECIMAL(10, 2) DEFAULT 10.00,
  rate_limit_per_minute INTEGER DEFAULT 10,
  features TEXT[] DEFAULT ARRAY['text-generation'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Provider Performance Metrics
CREATE TABLE ai_provider_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  average_response_time INTEGER, -- milliseconds
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0.000001,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model, date)
);

-- Enable Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view their own AI usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_ai_tiers
CREATE POLICY "Users can view their own AI tier"
  ON user_ai_tiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user AI tiers"
  ON user_ai_tiers FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for ai_provider_metrics
CREATE POLICY "Service role can manage AI provider metrics"
  ON ai_provider_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX idx_ai_provider_metrics_date ON ai_provider_metrics(date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_ai_usage_logs_updated_at
  BEFORE UPDATE ON ai_usage_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_tiers_updated_at
  BEFORE UPDATE ON user_ai_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_metrics_updated_at
  BEFORE UPDATE ON ai_provider_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default user tier for new users
CREATE OR REPLACE FUNCTION handle_new_user_ai_tier()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_ai_tiers (user_id, tier_name)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_ai_tier
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_ai_tier();
```

### Generate TypeScript Types

```bash
# Generate types từ database schema
npm run db:generate-types-remote
```

## 🎯 Bước 4: Cấu Hình AI Service

### Basic Configuration

Tạo file `src/lib/ai/config.ts`:

```typescript
import { AIServiceConfig } from './types'

export const aiConfig: AIServiceConfig = {
  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'openai',
  defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-3.5-turbo',
  
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      organization: process.env.OPENAI_ORGANIZATION,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxConcurrency: 5
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxConcurrency: 5
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY!,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxConcurrency: 5
    },
    cohere: {
      apiKey: process.env.COHERE_API_KEY!,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxConcurrency: 5
    }
  },
  
  usageTracking: {
    enabled: process.env.AI_USAGE_TRACKING_ENABLED === 'true',
    realTimeUpdates: true,
    batchSize: 10,
    flushInterval: 5000,
    retentionDays: 30
  },
  
  cache: {
    enabled: process.env.AI_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.AI_CACHE_TTL || '300000'),
    maxSize: parseInt(process.env.AI_CACHE_MAX_SIZE || '100'),
    strategy: (process.env.AI_CACHE_STRATEGY as 'lru' | 'fifo' | 'lfu') || 'lru'
  },
  
  rateLimit: {
    enabled: process.env.AI_RATE_LIMITING_ENABLED === 'true',
    requestsPerMinute: parseInt(process.env.AI_RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    requestsPerHour: parseInt(process.env.AI_RATE_LIMIT_REQUESTS_PER_HOUR || '1000'),
    requestsPerDay: parseInt(process.env.AI_RATE_LIMIT_REQUESTS_PER_DAY || '10000'),
    tokensPerDay: parseInt(process.env.AI_RATE_LIMIT_TOKENS_PER_DAY || '1000000'),
    costPerDay: parseFloat(process.env.AI_RATE_LIMIT_COST_PER_DAY || '100')
  },
  
  fallbackProviders: process.env.AI_FALLBACK_PROVIDERS?.split(',') || ['anthropic', 'google'],
  errorReporting: process.env.AI_ERROR_REPORTING_ENABLED === 'true'
}
```

### Custom AI Service Instance

Tạo file `src/lib/ai/ai-service-custom.ts`:

```typescript
import { createAIService } from './ai-service-server'
import { aiConfig } from './config'

export const customAIService = createAIService(aiConfig)

// Export singleton instance
export default customAIService
```

## 📊 Bước 5: Sử Dụng AI Service

### Server-side Usage

```typescript
// src/app/api/ai/generate/route.ts
import { createAIService } from '@/lib/ai/ai-service-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, options } = await request.json()
    
    const aiService = createAIService()
    
    const response = await aiService.generateText({
      prompt,
      model: model || 'gpt-3.5-turbo',
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      metadata: {
        userId: request.headers.get('x-user-id'),
        source: 'api-route'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        text: response.text,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        cost: response.cost
      }
    })
  } catch (error) {
    console.error('AI generation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
```

### Client-side Usage với Hook

```typescript
// src/hooks/useAIServiceCustom.ts
'use client'
import { useAIService } from '@/hooks/useAIService'
import { useAuth } from '@/hooks/use-auth'

export function useAIServiceCustom() {
  const { user } = useAuth()
  const aiService = useAIService()
  
  const generateTextWithTracking = async (params: {
    prompt: string
    model?: string
    options?: Record<string, any>
  }) => {
    try {
      const response = await aiService.generateText({
        ...params,
        metadata: {
          userId: user?.id,
          timestamp: new Date().toISOString(),
          ...params.options?.metadata
        }
      })
      
      return response
    } catch (error) {
      console.error('AI generation failed:', error)
      throw error
    }
  }
  
  return {
    generateText: generateTextWithTracking,
    ...aiService
  }
}
```

### Component Example

```typescript
// src/components/features/ai-chat.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAIServiceCustom } from '@/hooks/useAIServiceCustom'
import { useAIUsageOptimized } from '@/hooks/useAIUsageOptimized'

export function AIChat() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { generateText } = useAIServiceCustom()
  const { canUseAI, remainingRequests, usage } = useAIUsageOptimized()
  
  const handleGenerate = async () => {
    if (!prompt.trim() || !canUseAI) return
    
    setIsLoading(true)
    setResponse('')
    
    try {
      const result = await generateText({
        prompt,
        model: 'gpt-3.5-turbo',
        options: {
          maxTokens: 500,
          temperature: 0.7
        }
      })
      
      setResponse(result.text)
    } catch (error) {
      setResponse(`Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Chat Assistant</CardTitle>
        <div className="text-sm text-muted-foreground">
          Remaining requests: {remainingRequests} | 
          Total usage: {usage.totalRequests} requests
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Your Question
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything..."
            rows={3}
            disabled={!canUseAI}
          />
        </div>
        
        <Button 
          onClick={handleGenerate}
          disabled={!prompt.trim() || !canUseAI || isLoading}
          className="w-full"
        >
          {isLoading ? 'Thinking...' : 'Generate Response'}
        </Button>
        
        {response && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">AI Response:</h4>
            <p className="text-sm">{response}</p>
          </div>
        )}
        
        {!canUseAI && (
          <div className="text-sm text-destructive">
            You've reached your AI usage limit. Please try again later.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## 📈 Bước 6: Monitoring & Analytics

### Usage Dashboard Component

```typescript
// src/components/features/usage-dashboard.tsx
'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAIUsageOptimized } from '@/hooks/useAIUsageOptimized'

interface UsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  successRate: number
  requestsByProvider: Record<string, number>
  dailyUsage: Array<{
    date: string
    requests: number
    tokens: number
    cost: number
  }>
}

export function UsageDashboard() {
  const { usage, canUseAI, remainingRequests, remainingTokens } = useAIUsageOptimized()
  const [stats, setStats] = useState<UsageStats | null>(null)
  
  useEffect(() => {
    // Fetch detailed stats from API
    fetch('/api/ai/usage-stats')
      .then(res => res.json())
      .then(data => setStats(data.data))
      .catch(console.error)
  }, [])
  
  const usagePercentage = (usage.totalRequests / 1000) * 100 // Assuming 1000 requests limit
  const costPercentage = (usage.totalCost / 50) * 100 // Assuming $50 cost limit
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Badge variant={canUseAI ? "default" : "destructive"}>
            {canUseAI ? "Active" : "Limited"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.totalRequests}</div>
          <p className="text-xs text-muted-foreground">
            {remainingRequests} remaining
          </p>
          <Progress value={usagePercentage} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usage.totalTokens.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {remainingTokens.toLocaleString()} remaining
          </p>
          <Progress value={(usage.totalTokens / 100000) * 100} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${usage.totalCost.toFixed(4)}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
          <Progress value={costPercentage} className="mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.averageResponseTime 
              ? `${stats.averageResponseTime}ms avg response`
              : 'No data'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### API Route for Usage Stats

```typescript
// src/app/api/ai/usage-stats/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's usage stats
    const { data: usageLogs } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000)
    
    // Calculate stats
    const totalRequests = usageLogs?.length || 0
    const successfulRequests = usageLogs?.filter(log => log.success).length || 0
    const totalTokens = usageLogs?.reduce((sum, log) => sum + log.total_tokens, 0) || 0
    const totalCost = usageLogs?.reduce((sum, log) => sum + parseFloat(log.cost.toString()), 0) || 0
    const averageResponseTime = usageLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) / totalRequests || 0
    
    const stats = {
      totalRequests,
      totalTokens,
      totalCost,
      averageResponseTime: Math.round(averageResponseTime),
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      requestsByProvider: usageLogs?.reduce((acc, log) => {
        acc[log.provider] = (acc[log.provider] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Failed to fetch usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}
```

## 🔒 Bước 7: Security Best Practices

### API Key Security

1. **Never expose API keys on client-side**
2. **Use environment variables** cho tất cả sensitive data
3. **Rotate API keys regularly**
4. **Use different keys** cho development và production

### Input Validation

```typescript
// src/lib/ai/validation.ts
import { z } from 'zod'

export const aiRequestSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt cannot be empty')
    .max(10000, 'Prompt too long')
    .transform(val => val.trim()),
  model: z.string().optional(),
  maxTokens: z.number()
    .min(1, 'Max tokens must be at least 1')
    .max(4000, 'Max tokens cannot exceed 4000')
    .optional(),
  temperature: z.number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature cannot exceed 2')
    .optional()
})

export function validateAIRequest(data: unknown) {
  return aiRequestSchema.parse(data)
}
```

### Rate Limiting Middleware

```typescript
// src/middleware/ai-rate-limit.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function aiRateLimitMiddleware(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check user's current usage
  const { data: usageLogs } = await supabase
    .from('ai_usage_logs')
    .select('total_tokens, cost')
    .eq('user_id', user.id)
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
  
  const totalTokens = usageLogs?.reduce((sum, log) => sum + log.total_tokens, 0) || 0
  const totalCost = usageLogs?.reduce((sum, log) => sum + parseFloat(log.cost.toString()), 0) || 0
  
  // Get user's tier limits
  const { data: userTier } = await supabase
    .from('user_ai_tiers')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (totalTokens > (userTier?.max_tokens_per_day || 10000)) {
    return NextResponse.json(
      { error: 'Daily token limit exceeded' },
      { status: 429 }
    )
  }
  
  if (totalCost > (userTier?.max_cost_per_day || 10)) {
    return NextResponse.json(
      { error: 'Daily cost limit exceeded' },
      { status: 429 }
    )
  }
  
  return null // Allow request to proceed
}
```

## 💰 Bước 8: Cost Optimization

### Smart Model Selection

```typescript
// src/lib/ai/model-selector.ts
interface ModelSelection {
  provider: string
  model: string
  costPerToken: number
  maxTokens: number
  capabilities: string[]
}

const MODEL_HIERARCHY: ModelSelection[] = [
  // Free/Cheap models for simple tasks
  { provider: 'openai', model: 'gpt-3.5-turbo', costPerToken: 0.000002, maxTokens: 4096, capabilities: ['text-generation'] },
  { provider: 'google', model: 'gemini-pro', costPerToken: 0.0000005, maxTokens: 30720, capabilities: ['text-generation'] },
  
  // Mid-tier models
  { provider: 'openai', model: 'gpt-4o-mini', costPerToken: 0.00000015, maxTokens: 128000, capabilities: ['text-generation'] },
  { provider: 'anthropic', model: 'claude-3-haiku', costPerToken: 0.00000025, maxTokens: 200000, capabilities: ['text-generation'] },
  
  // Premium models for complex tasks
  { provider: 'openai', model: 'gpt-4o', costPerToken: 0.000005, maxTokens: 128000, capabilities: ['text-generation', 'vision'] },
  { provider: 'anthropic', model: 'claude-3-5-sonnet', costPerToken: 0.000003, maxTokens: 200000, capabilities: ['text-generation', 'vision'] }
]

export function selectOptimalModel(
  taskType: 'simple' | 'complex' | 'creative' | 'analytical',
  maxTokensNeeded: number,
  budget?: number
): ModelSelection {
  const suitableModels = MODEL_HIERARCHY.filter(model => {
    // Check if model can handle required tokens
    if (model.maxTokens < maxTokensNeeded) return false
    
    // Check budget constraints
    if (budget && (model.costPerToken * maxTokensNeeded) > budget) return false
    
    // Check task complexity
    if (taskType === 'simple' && model.costPerToken > 0.000001) return false
    if (taskType === 'complex' && model.costPerToken < 0.000001) return false
    
    return true
  })
  
  // Return cheapest suitable model
  return suitableModels.sort((a, b) => a.costPerToken - b.costPerToken)[0] || MODEL_HIERARCHY[0]
}
```

### Caching Strategy

```typescript
// src/lib/ai/cache-manager.ts
interface CacheEntry {
  data: any
  timestamp: number
  hits: number
  lastAccessed: number
}

export class SmartCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private ttl: number
  
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.ttl = ttl
  }
  
  generateKey(prompt: string, model: string, options: Record<string, any>): string {
    const keyData = {
      prompt: prompt.toLowerCase().trim(),
      model,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000
    }
    return btoa(JSON.stringify(keyData))
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    entry.hits++
    entry.lastAccessed = now
    return entry.data
  }
  
  set(key: string, data: any): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      let oldestKey = ''
      let oldestTime = Date.now()
      
      for (const [cacheKey, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed
          oldestKey = cacheKey
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    })
  }
  
  getStats() {
    const entries = Array.from(this.cache.values())
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageHits: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length : 0
    }
  }
}

export const aiCache = new SmartCache()
```

## 🧪 Bước 9: Testing AI Module

### Unit Tests

```typescript
// tests/ai/ai-service.test.ts
import { createAIService } from '@/lib/ai/ai-service-server'
import { aiConfig } from '@/lib/ai/config'

describe('AI Service', () => {
  let aiService: ReturnType<typeof createAIService>
  
  beforeEach(() => {
    aiService = createAIService({
      ...aiConfig,
      usageTracking: { ...aiConfig.usageTracking, enabled: false },
      cache: { ...aiConfig.cache, enabled: false }
    })
  })
  
  it('should generate text successfully', async () => {
    const response = await aiService.generateText({
      prompt: 'Test prompt',
      model: 'gpt-3.5-turbo',
      maxTokens: 10
    })
    
    expect(response.text).toBeDefined()
    expect(response.text.length).toBeGreaterThan(0)
    expect(response.model).toBe('gpt-3.5-turbo')
    expect(response.usage).toBeDefined()
    expect(response.cost).toBeGreaterThan(0)
  })
  
  it('should handle errors gracefully', async () => {
    // Mock invalid API key
    const invalidService = createAIService({
      ...aiConfig,
      providers: {
        openai: { ...aiConfig.providers.openai, apiKey: 'invalid-key' }
      }
    })
    
    await expect(invalidService.generateText({
      prompt: 'Test',
      model: 'gpt-3.5-turbo'
    })).rejects.toThrow()
  })
})
```

### Integration Tests

```typescript
// tests/api/ai/generate.test.ts
import { createApp } from '@/app/api/ai/generate/route'

describe('AI Generate API', () => {
  it('should generate text successfully', async () => {
    const request = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-id'
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
        model: 'gpt-3.5-turbo'
      })
    })
    
    const response = await createApp(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.text).toBeDefined()
  })
  
  it('should validate input', async () => {
    const request = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '' }) // Empty prompt
    })
    
    const response = await createApp(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('prompt')
  })
})
```

## 🚀 Bước 10: Deployment Considerations

### Production Configuration

1. **Use production API keys** with appropriate permissions
2. **Set conservative rate limits** to prevent cost overruns
3. **Enable comprehensive logging** for monitoring
4. **Set up alerts** for unusual usage patterns
5. **Configure backup providers** for reliability

### Environment-Specific Settings

```typescript
// src/lib/ai/config-production.ts
import { AIServiceConfig } from './types'

export const productionConfig: AIServiceConfig = {
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini', // More cost-effective
  
  usageTracking: {
    enabled: true,
    realTimeUpdates: true,
    batchSize: 50, // Larger batches for production
    flushInterval: 10000, // Less frequent flushes
    retentionDays: 90 // Longer retention for analytics
  },
  
  cache: {
    enabled: true,
    ttl: 600000, // 10 minutes cache
    maxSize: 1000, // Larger cache for production
    strategy: 'lru'
  },
  
  rateLimit: {
    enabled: true,
    requestsPerMinute: 30, // More conservative
    requestsPerHour: 500,
    requestsPerDay: 5000,
    tokensPerDay: 500000,
    costPerDay: 50
  }
}
```

### Monitoring & Alerting

```typescript
// src/lib/ai/monitoring.ts
export class AIMonitor {
  static async checkAnomalies() {
    const anomalies = await Promise.all([
      this.checkCostSpikes(),
      this.checkErrorRates(),
      this.checkUnusualUsage()
    ])
    
    if (anomalies.some(Boolean)) {
      await this.sendAlert(anomalies)
    }
  }
  
  private static async checkCostSpikes(): Promise<boolean> {
    // Check if cost increased by >200% compared to yesterday
    // Implementation details...
    return false
  }
  
  private static async checkErrorRates(): Promise<boolean> {
    // Check if error rate > 10%
    // Implementation details...
    return false
  }
  
  private static async checkUnusualUsage(): Promise<boolean> {
    // Check for unusual usage patterns
    // Implementation details...
    return false
  }
  
  private static async sendAlert(anomalies: boolean[]): Promise<void> {
    // Send alert to monitoring system
    // Implementation details...
  }
}
```

## 📚 Resources & References

### Documentation
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Documentation](https://docs.anthropic.com)
- [Google AI Documentation](https://ai.google.dev/docs)
- [Cohere Documentation](https://docs.cohere.com)

### Best Practices
- [Prompt Engineering Guide](https://platform.openai.com/docs/prompt-engineering)
- [AI Security Guidelines](https://platform.openai.com/docs/safety-best-practices)
- [Cost Optimization Strategies](https://platform.openai.com/docs/cost-and-usage)

### Community
- [OpenAI Community Forum](https://community.openai.com)
- [Anthropic Community](https://community.anthropic.com)
- [AI/ML Stack Overflow](https://stackoverflow.com/questions/tagged/ai+ml)

---

Bạn đã hoàn thành thiết lập AI Module! 🎉

Bây giờ bạn có thể:
- Sử dụng nhiều AI providers với fallback tự động
- Theo dõi usage và costs trong real-time
- Implement rate limiting và user tiers
- Optimize costs với intelligent caching
- Monitor performance và anomalies

Chúc bạn phát triển thành công các tính năng AI-powered! 🚀