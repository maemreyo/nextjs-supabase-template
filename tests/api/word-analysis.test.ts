// Mock Request object for Node.js environment before any imports
const MockRequest = class {
  constructor(input: string | Request, init?: RequestInit) {
    // Mock implementation
  }
}

// Set global Request before importing Next.js modules
;(global as any).Request = MockRequest

import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('../../src/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        eq: jest.fn(),
      }),
    }),
  }),
}))

// Mock AI service
jest.mock('../../src/lib/ai/ai-service-server', () => ({
  createAIServiceServer: () => ({
    analyzeWord: jest.fn().mockResolvedValue({
      success: true,
      data: {
        word: 'test',
        definition: 'Test definition',
        synonyms: ['test1', 'test2'],
        antonyms: ['opposite1', 'opposite2'],
        pronunciation: '/test/',
        partOfSpeech: 'noun',
        examples: ['This is a test example.'],
        frequency: 'common',
        collocations: ['test case', 'test data'],
        etymology: 'From Latin testum',
        usage: 'Used for testing purposes',
        difficulty: 'intermediate'
      }
    }),
  }),
}))

describe('/api/ai/analyze-word', () => {
  it('should analyze word successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      body: JSON.stringify({
        word: 'test',
        language: 'en'
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    // Import: handler after mocking
    const { POST } = await import('../../src/app/api/ai/analyze-word/route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.word).toBe('test')
  })

  it('should handle missing word parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'content-type': 'application/json',
      },
    })

    const { POST } = await import('../../src/app/api/ai/analyze-word/route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Word parameter is required')
  })

  it('should handle empty word parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      body: JSON.stringify({
        word: '',
        language: 'en'
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const { POST } = await import('../../src/app/api/ai/analyze-word/route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Word parameter is required')
  })

  it('should handle missing language parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      body: JSON.stringify({
        word: 'test',
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const { POST } = await import('../../src/app/api/ai/analyze-word/route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Language parameter is required')
  })

  it('should validate language parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      body: JSON.stringify({
        word: 'test',
        language: 'invalid'
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const { POST } = await import('../../src/app/api/ai/analyze-word/route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid language parameter')
  })

  it('should handle AI service errors', async () => {
    // Mock AI service to return an error
    const { createAIServiceServer } = await import('../../src/lib/ai/ai-service-server')
    const mockService = createAIServiceServer()
    ;(mockService.analyzeWord as any).mockRejectedValue(new Error('AI service error'))

    const request = new NextRequest('http://localhost:3000/api/ai/analyze-word', {
      method: 'POST',
      body: JSON.stringify({
        word: 'test',
        language: 'en'
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const { POST } = await import('../../src/app/api/ai/analyze-word/route')

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('AI service error')
  })
})