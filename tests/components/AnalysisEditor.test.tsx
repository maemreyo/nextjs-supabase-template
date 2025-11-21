import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnalysisEditor } from '@/components/analysis/AnalysisEditor'
import type { AnalysisEditorProps } from '@/components/analysis/types'

// Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveBeenCalled(): R
      toHaveBeenCalledWith(...args: any[]): R
      toBeDisabled(): R
      not: {
        toBeInTheDocument(): R
        toBeDisabled(): R
      }
      toHaveValue(value: string): R
    }
    
    interface Mock<T, Y extends any[]> {
      (...args: Y): T
      mockResolvedValue(value: any): jest.Mock<T, Y>
      mockReturnValue(value: any): jest.Mock<T, Y>
      mockImplementation(fn: (...args: any[]) => any): jest.Mock<T, Y>
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
  clearAllMocks(): void
  mock(path: string, factory: () => any): void
}

// Mock functions
const mockOnTextSelect = jest.fn()
const mockOnAnalyze = jest.fn()

// Test wrapper với QueryClient
const createTestWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('AnalysisEditor', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    jest.clearAllMocks()
  })

  const renderComponent = (props: Partial<AnalysisEditorProps> = {}) => {
    const defaultProps: AnalysisEditorProps = {
      onTextSelect: mockOnTextSelect,
      onAnalyze: mockOnAnalyze,
      initialText: '',
      className: ''
    }

    return render(
      <AnalysisEditor {...defaultProps} {...props} />,
      {
        wrapper: createTestWrapper(queryClient)
      }
    )
  }

  it('renders editor with placeholder text', () => {
    renderComponent()
    
    expect(screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')).toBeInTheDocument()
    expect(screen.getByText('Văn bản phân tích')).toBeInTheDocument()
  })

  it('displays text statistics', () => {
    renderComponent({ initialText: 'This is a test sentence.' })
    
    expect(screen.getByText(/26 ký tự/)).toBeInTheDocument()
    expect(screen.getByText(/6 từ/)).toBeInTheDocument()
    expect(screen.getByText(/1 câu/)).toBeInTheDocument()
    expect(screen.getByText(/1 đoạn/)).toBeInTheDocument()
  })

  it('handles text selection', async () => {
    renderComponent({ initialText: 'This is a test sentence.' })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Simulate text selection
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: 4 // "This"
      }
    })
    
    await waitFor(() => {
      expect(mockOnTextSelect).toHaveBeenCalledWith('This', 'word')
    })
  })

  it('detects sentence selection', async () => {
    renderComponent({ initialText: 'This is a test sentence. Another sentence.' })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Simulate sentence selection
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: 25 // "This is a test sentence."
      }
    })
    
    await waitFor(() => {
      expect(mockOnTextSelect).toHaveBeenCalledWith('This is a test sentence.', 'sentence')
    })
  })

  it('detects paragraph selection', async () => {
    const longText = 'This is the first sentence. This is the second sentence. This is the third sentence.'
    renderComponent({ initialText: longText })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Simulate paragraph selection
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: longText.length
      }
    })
    
    await waitFor(() => {
      expect(mockOnTextSelect).toHaveBeenCalledWith(longText, 'paragraph')
    })
  })

  it('shows selected text badge', () => {
    renderComponent({ initialText: 'This is a test.' })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Select some text
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: 4
      }
    })
    
    expect(screen.getByText('Đã chọn: 4 ký tự')).toBeInTheDocument()
  })

  it('shows analysis tabs when text is selected', () => {
    renderComponent({ initialText: 'This is a test.' })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Select some text
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: 4
      }
    })
    
    expect(screen.getByText('Từ')).toBeInTheDocument()
    expect(screen.getByText('Câu')).toBeInTheDocument()
    expect(screen.getByText('Đoạn')).toBeInTheDocument()
  })

  it('calls onAnalyze when analyze button is clicked', async () => {
    const mockAnalyze = jest.fn().mockResolvedValue(undefined)
    renderComponent({ 
      initialText: 'This is a test.',
      onAnalyze: mockAnalyze
    })
    
    const analyzeButton = screen.getByText('Phân tích')
    fireEvent.click(analyzeButton)
    
    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledWith('This is a test.', 'word')
    })
  })

  it('calls onAnalyze with selected text when text is selected', async () => {
    const mockAnalyze = jest.fn().mockResolvedValue(undefined)
    renderComponent({ 
      initialText: 'This is a test sentence.',
      onAnalyze: mockAnalyze
    })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Select text
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: 25 // "This is a test sentence."
      }
    })
    
    // Click analyze button in selected text section
    const analyzeButtons = screen.getAllByText('Phân tích câu')
    if (analyzeButtons[0]) {
      fireEvent.click(analyzeButtons[0])
    }
    
    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledWith('This is a test sentence.', 'sentence')
    })
  })

  it('disables analyze button when no text', () => {
    renderComponent({ initialText: '' })
    
    const analyzeButton = screen.getByText('Phân tích')
    expect(analyzeButton).toBeDisabled()
  })

  it('enables analyze button when text is present', () => {
    renderComponent({ initialText: 'Some text' })
    
    const analyzeButton = screen.getByText('Phân tích')
    expect(analyzeButton).not.toBeDisabled()
  })

  it('shows loading state during analysis', async () => {
    let resolveAnalysis: (value: void) => void
    const mockAnalyze = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveAnalysis = resolve
      })
    })
    
    renderComponent({ 
      initialText: 'Test text',
      onAnalyze: mockAnalyze
    })
    
    const analyzeButton = screen.getByText('Phân tích')
    fireEvent.click(analyzeButton)
    
    // Should show loading state
    expect(screen.getByText('Đang phân tích...')).toBeInTheDocument()
    expect(screen.getByText('Phân tích')).toBeDisabled()
    
    // Resolve the analysis
    resolveAnalysis!()
    
    await waitFor(() => {
      expect(screen.queryByText('Đang phân tích...')).not.toBeInTheDocument()
      expect(screen.getByText('Phân tích')).not.toBeDisabled()
    })
  })

  it('updates text when user types', () => {
    renderComponent()
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    fireEvent.change(textarea, { target: { value: 'New text' } })
    
    expect(textarea).toHaveValue('New text')
  })

  it('handles tab changes for selected text', async () => {
    renderComponent({ initialText: 'This is a test.' })
    
    const textarea = screen.getByPlaceholderText('Nhập hoặc dán văn bản cần phân tích vào đây...')
    
    // Select text to show tabs
    fireEvent.select(textarea, {
      target: {
        selectionStart: 0,
        selectionEnd: 4
      }
    })
    
    // Click on sentence tab
    const sentenceTab = screen.getByText('Câu')
    fireEvent.click(sentenceTab)
    
    expect(screen.getByText('Phân tích cấu trúc ngữ pháp, ý nghĩa, và các gợi ý viết lại câu để cải thiện.')).toBeInTheDocument()
    
    // Click on paragraph tab
    const paragraphTab = screen.getByText('Đoạn')
    fireEvent.click(paragraphTab)
    
    expect(screen.getByText('Phân tích toàn diện đoạn văn về cấu trúc, mạch lạc, phong cách và các góp ý cải thiện.')).toBeInTheDocument()
  })
})