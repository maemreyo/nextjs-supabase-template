# AI Module Guide

This guide provides comprehensive documentation for the AI module in the Next.js Supabase Template. The AI module is designed to provide a flexible, scalable foundation for integrating AI services into your application.

## 🧠 Overview

The AI module provides:

- **Multi-Provider Support**: Integration with multiple AI providers (OpenAI, Anthropic, Google, etc.)
- **Usage Tracking**: Comprehensive tracking and monitoring of AI usage
- **Smart Rate Limiting**: Intelligent rate limiting based on user tiers and provider limits
- **Error Handling**: Robust error handling with fallback strategies
- **Cost Management**: Built-in cost tracking and budget controls
- **Caching**: Intelligent caching to improve performance and reduce costs

## 🏗️ Architecture

### Core Components

```
AI Module Architecture
├── AI Service Layer
│   ├── Provider Registry
│   ├── Usage Tracker
│   └── Error Handler
├── API Layer
│   ├── AI Operations Routes
│   ├── Usage Checking Middleware
│   └── Rate Limiting
├── Client Layer
│   ├── AI Hooks
│   ├── React Components
│   └── State Management
└── Database Layer
    ├── Usage Tracking Tables
    ├── Provider Performance Metrics
    └── User Limits & Tiers
```

### Design Principles

1. **Provider Agnostic**: Easy to switch between AI providers
2. **Usage Aware**: Built-in tracking and monitoring
3. **Fault Tolerant**: Graceful degradation and fallbacks
4. **Performance Optimized**: Caching and intelligent batching
5. **Secure**: API key management and access controls

## 📁 Directory Structure

```
src/lib/ai/
├── providers/           # AI provider implementations
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   ├── gemini-provider.ts
│   └── index.ts
├── models/              # AI model configurations
│   ├── model-configs.ts
│   ├── educational-models.ts
│   ├── free-models.ts
│   └── types.ts
├── utils/               # Utility functions
│   ├── error-reporting.ts
│   └── type-helpers.ts
├── prompts/             # Prompt templates
│   └── vocabulary-extraction.ts
├── monitoring/          # Monitoring and analytics
│   └── batch-monitor.ts
├── types.ts             # TypeScript definitions
├── ai-service.ts        # Main AI service
├── ai-service-client.ts # Client-side AI service
├── ai-service-server.ts # Server-side AI service
├── usage-logger.ts      # Usage tracking utilities
└── usage-logs.ts        # Usage log management
```

## 🔧 Setup & Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# AI Configuration
AI_DEFAULT_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7

# Usage Tracking
AI_USAGE_TRACKING_ENABLED=true
AI_RATE_LIMITING_ENABLED=true
AI_CACHE_ENABLED=true
```

### Database Setup

Run the AI module migration to create the necessary tables:

```sql
-- This will be created in supabase/migrations/ai_module.sql
```

## 🚀 Usage Examples

### Basic AI Service Usage

```typescript
// Server-side usage
import { createAIService } from '@/lib/ai/ai-service-server'

const aiService = createAIService()
const response = await aiService.generateText({
  prompt: "Explain quantum computing",
  model: "gpt-3.5-turbo",
  maxTokens: 500
})
```

```typescript
// Client-side usage
import { useAIService } from '@/hooks/useAIService'

function AIComponent() {
  const { generateText, isLoading, error } = useAIService()
  
  const handleGenerate = async () => {
    const response = await generateText({
      prompt: "Write a poem about AI",
      model: "gpt-3.5-turbo"
    })
    console.log(response)
  }
  
  return (
    <button onClick={handleGenerate} disabled={isLoading}>
      Generate Text
    </button>
  )
}
```

### Usage Tracking Integration

```typescript
// With usage tracking
import { useAIUsageOptimized } from '@/hooks/useAIUsageOptimized'

function UsageAwareAIComponent() {
  const { 
    generateText, 
    usage, 
    canUseAI, 
    remainingRequests 
  } = useAIUsageOptimized()
  
  const handleGenerate = async () => {
    if (!canUseAI) {
      alert(`You've reached your limit. ${remainingRequests} requests remaining.`)
      return
    }
    
    const response = await generateText({
      prompt: "Generate content",
      model: "gpt-3.5-turbo"
    })
    
    console.log(`Usage: ${usage.totalRequests} requests, ${usage.totalTokens} tokens`)
  }
  
  return (
    <div>
      <button onClick={handleGenerate}>
        Generate ({remainingRequests} left)
      </button>
      <div>Usage: {usage.totalRequests} requests</div>
    </div>
  )
}
```

## 📊 Usage Tracking System

### Features

- **Real-time Tracking**: Monitor AI usage in real-time
- **User Tiers**: Different limits for different user types
- **Provider Monitoring**: Track performance and costs per provider
- **Smart Rate Limiting**: Intelligent rate limiting based on usage patterns
- **Cost Analysis**: Detailed cost breakdown and predictions

### Implementation

The usage tracking system consists of:

1. **Client-side Logging**: Lightweight logging for immediate feedback
2. **Server-side Tracking**: Comprehensive tracking in the database
3. **Real-time Updates**: Live usage updates via Supabase realtime
4. **Analytics Dashboard**: Visual representation of usage data

### Usage Data Structure

```typescript
interface AIUsageLog {
  id: string
  userId: string
  provider: 'openai' | 'anthropic' | 'google' | 'cohere'
  model: string
  operation: 'text-generation' | 'embedding' | 'image-generation'
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: Date
  metadata: Record<string, any>
}
```

## 🎯 Best Practices

### 1. Provider Selection

Choose the right provider for your use case:

- **OpenAI**: Best for general-purpose text generation
- **Anthropic**: Best for long-context and safety-focused applications
- **Google**: Best for integration with Google ecosystem
- **Cohere**: Best for enterprise and RAG applications

### 2. Cost Optimization

- Use appropriate model sizes (don't over-provision)
- Implement caching for repeated requests
- Monitor usage regularly
- Set up alerts for unusual usage patterns

### 3. Error Handling

- Always implement fallback strategies
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry logic with exponential backoff

### 4. Security

- Never expose API keys on the client side
- Implement proper authentication and authorization
- Validate and sanitize all inputs
- Use HTTPS for all AI API calls

### 5. Performance

- Use streaming for long responses
- Implement request batching when possible
- Optimize prompts for faster responses
- Use appropriate timeout values

## 🔍 Monitoring & Analytics

### Key Metrics to Track

1. **Usage Metrics**
   - Total requests per user
   - Token consumption
   - Cost per operation
   - Error rates

2. **Performance Metrics**
   - Response time per provider
   - Success rate
   - Cache hit rate
   - Rate limit violations

3. **Business Metrics**
   - User engagement
   - Feature adoption
   - Cost per user
   - ROI analysis

### Dashboard Components

The template includes pre-built dashboard components:

- `UsageDashboard`: Comprehensive usage overview
- `CompactUsageDashboard`: Minimal usage display
- `AIUsageTest`: Testing and debugging component

## 🛠️ Advanced Features

### 1. Custom Providers

Add your own AI providers:

```typescript
import { AIProvider } from '@/lib/ai/types'

class CustomAIProvider implements AIProvider {
  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    // Implementation
  }
  
  async getModels(): Promise<AIModel[]> {
    // Implementation
  }
  
  // ... other methods
}
```

### 2. Prompt Engineering

Use the built-in prompt management system:

```typescript
import { getPrompt } from '@/lib/ai/prompts'

const prompt = await getPrompt('vocabulary-extraction', {
  context: 'English learning',
  difficulty: 'intermediate'
})
```

### 3. Batch Processing

Process multiple requests efficiently:

```typescript
const batchService = createBatchAIService()
const results = await batchService.processBatch([
  { prompt: "Request 1", model: "gpt-3.5-turbo" },
  { prompt: "Request 2", model: "gpt-3.5-turbo" },
  // ... more requests
])
```

## 🧪 Testing

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react'
import { AIComponent } from '@/components/ai-examples'

describe('AI Component', () => {
  it('should render AI interface', () => {
    render(<AIComponent />)
    expect(screen.getByText('Generate Text')).toBeInTheDocument()
  })
})
```

### Integration Testing

```typescript
import { createAIService } from '@/lib/ai/ai-service-server'

describe('AI Service Integration', () => {
  it('should generate text successfully', async () => {
    const aiService = createAIService()
    const response = await aiService.generateText({
      prompt: 'Test prompt',
      model: 'gpt-3.5-turbo'
    })
    
    expect(response.text).toBeDefined()
    expect(response.usage).toBeDefined()
  })
})
```

## 🚀 Deployment Considerations

### Environment Configuration

- Use different API keys for development and production
- Configure appropriate rate limits for each environment
- Set up monitoring and alerting
- Implement proper logging

### Scaling

- Consider using a queue system for high-volume applications
- Implement horizontal scaling for AI processing
- Use CDN for caching responses
- Monitor resource usage and optimize accordingly

## 🔮 Future Enhancements

Planned features for the AI module:

1. **Advanced Caching**: Semantic caching and intelligent invalidation
2. **Multi-modal Support**: Image, audio, and video processing
3. **Fine-tuning Integration**: Custom model fine-tuning capabilities
4. **Advanced Analytics**: Predictive analytics and usage forecasting
5. **Edge Computing**: Edge AI processing for lower latency
6. **Workflow Automation**: AI-powered workflow automation

## 📚 Additional Resources

- [AI Provider Documentation](./ai-providers.md)
- [Usage Tracking Guide](./usage-tracking.md)
- [Error Handling Best Practices](./error-handling.md)
- [Performance Optimization](./performance-optimization.md)
- [Security Guidelines](./security-guidelines.md)

## 🤝 Contributing

To contribute to the AI module:

1. Follow the existing code patterns and conventions
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure backward compatibility
5. Submit pull requests with clear descriptions

This AI module provides a solid foundation for building AI-powered applications with proper usage tracking, cost management, and scalability considerations.