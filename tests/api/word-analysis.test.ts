import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/analyze-word/route'

import '@types/jest'

// Jest globals
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R
      toBeDefined(): R
      toHaveBeenCalled(): R
      toHaveBeenCalledWith(...args: any[]): R
    }
    
    interface Mock<T, Y extends any[]> {
      (...args: Y): T
      mockResolvedValue(value: any): jest.Mock<T, Y>
      mockReturnValue(value: any): jest.Mock<T, Y>
    }
  }
}

declare const describe: (name: string, fn: () => void) => void
declare const it: (name: string, fn: () => Promise<void> | void) => void
declare const test: (name: string, fn: () => Promise<void> | void) => void
declare const expect: (actual: any) => jest.Matchers<any>
declare const beforeAll: (fn: () => Promise<void> | void) => void
declare const afterAll: (fn: () => Promise<void> | void) => void
declare const beforeEach: (fn: () => Promise<void> | void) => void
declare const afterEach: (fn: () => Promise<void> | void) => void
declare const jest: {
  fn<T = any, Y extends any[] = any[]>(): jest.Mock<T, Y>
  mock(path: string, factory: () => any): void
}

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'test-id' },
            error: null
          })
        })
      })
    })
  })
}))

// Mock AI service
jest.mock('@/lib/ai/ai-service-server', () => ({
  createAIServiceServer: () => ({
    analyzeWord: jest.fn().mockResolvedValue({
      success: true,
      data: {
        meta: {
          word: 'test',
          ipa: '/test/',
          pos: 'noun',
          cefr: 'A1',
          tone: 'neutral'
        },
        definitions: {
          root_meaning: 'test definition',
          context_meaning: 'test in context',
          vietnamese_translation: 'kiểm tra'
        },
        inference_strategy: {
          clues: 'test clues',
          reasoning: 'test reasoning'
        },
        relations: {
          synonyms: [],
          antonyms: []
        },
        usage: {
          collocations: [],
          example_sentence: 'This is a test.',
          example_translation: 'Đây là một bài kiểm tra.'
        }
      },
      metadata: {
        processingTime: 1000,
        tokensUsed: 100,
        cost: 0.001,
        model: 'gpt-3.5-turbo',
        provider: 'openai'
      }
    })
  })
}))

describe('/api/ai/analyze-word', () => {
  it('should analyze word successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        word: 'test',
        sentenceContext: 'This is a test sentence.',
        paragraphContext: 'This is a test paragraph.',
        maxItems: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.meta.word).toBe('test')
  })

  it('should return error for missing word', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        sentenceContext: 'This is a test sentence.',
        paragraphContext: 'This is a test paragraph.'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Word is required')
  })

  it('should return error for missing sentence context', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        word: 'test',
        paragraphContext: 'This is a test paragraph.'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Sentence context is required')
  })

  it('should return error for missing authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: 'test',
        sentenceContext: 'This is a test sentence.',
        paragraphContext: 'This is a test paragraph.'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authorization header required')
  })

  it('should handle word length validation', async () => {
    const longWord = 'a'.repeat(101)
    
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        word: longWord,
        sentenceContext: 'This is a test sentence.',
        paragraphContext: 'This is a test paragraph.'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Word too long (max 100 characters)')
  })

  it('should handle sentence context length validation', async () => {
    const longContext = 'a'.repeat(1001)
    
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        word: 'test',
        sentenceContext: longContext,
        paragraphContext: 'This is a test paragraph.'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Sentence context too long (max 1000 characters)')
  })

  it('should handle paragraph context length validation', async () => {
    const longContext = 'a'.repeat(2001)
    
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        word: 'test',
        sentenceContext: 'This is a test sentence.',
        paragraphContext: longContext
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Paragraph context too long (max 2000 characters)')
  })

  it('should validate maxItems parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user'
      },
      body: JSON.stringify({
        word: 'test',
        sentenceContext: 'This is a test sentence.',
        paragraphContext: 'This is a test paragraph.',
        maxItems: 15
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Max items must be between 1 and 10')
  })
})