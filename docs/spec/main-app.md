# AI Semantic Analysis Editor - Implementation Plan

## VISION

**Ứng dụng Rich Text Editor với AI phân tích ngữ nghĩa sâu:**
1. ✅ Phân tích từ/cụm từ theo ngữ cảnh câu, đoạn
2. ✅ Phân tích câu theo ngữ cảnh đoạn  
3. ✅ Phân tích đoạn văn
4. ✅ Hiển thị highlight + tooltip với giải thích AI
5. ✅ Real-time analysis khi user viết

**Template có sẵn:**
- ✅ AI Module (OpenAI, Anthropic, Google AI, Cohere)
- ✅ Supabase Database
- ✅ TanStack Query
- ✅ Shadcn UI

---

## PHASE 1: SETUP & CORE EDITOR (Day 1-2)

### 1.1 Clone & Setup
```bash
git clone https://github.com/maemreyo/nextjs-supabase-template.git ai-editor
cd ai-editor
npm install
```

### 1.2 Environment Setup
```bash
cp .env.example .env.local

# Edit .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Provider (chọn 1 hoặc nhiều)
GOOGLE_AI_API_KEY=your_google_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### 1.3 Database Setup
```bash
npm run db:push
npm run db:generate-types-remote
npm run dev
```

### 1.4 Clean Template (GIỮ AI Module)
**Keep:**
- ✅ `src/lib/ai/` - Core AI module
- ✅ Auth system
- ✅ Shadcn UI
- ✅ TanStack Query

**Remove:**
- ❌ AI example pages (nếu có)
- ❌ Unused API routes

### 1.5 Install Tiptap
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-placeholder \
  @tiptap/extension-text-style \
  @tiptap/extension-color \
  @tiptap/extension-highlight
```

---

## PHASE 2: AI SEMANTIC ANALYSIS SYSTEM (Day 3-5)

### 2.1 Custom Tiptap Extensions for AI Analysis

**Create:** `src/components/editor/extensions/SemanticAnalysis.ts`

```typescript
import { Mark } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Custom Mark để lưu AI analysis data
export const SemanticWord = Mark.create({
  name: 'semanticWord',
  
  addAttributes() {
    return {
      wordId: { default: null },
      analysis: { 
        default: null,
        parseHTML: element => element.getAttribute('data-analysis'),
        renderHTML: attributes => ({
          'data-analysis': attributes.analysis,
        }),
      },
      confidence: { default: null },
      sentenceContext: { default: null },
      paragraphContext: { default: null }
    }
  },
  
  parseHTML() {
    return [{ tag: 'span[data-semantic-word]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      'data-semantic-word': true,
      class: 'semantic-word cursor-help underline decoration-dotted decoration-blue-500',
    }, 0]
  },
})

export const SemanticSentence = Mark.create({
  name: 'semanticSentence',
  
  addAttributes() {
    return {
      sentenceId: { default: null },
      analysis: { default: null },
      sentiment: { default: null },
      complexity: { default: null },
      paragraphContext: { default: null }
    }
  },
  
  parseHTML() {
    return [{ tag: 'span[data-semantic-sentence]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      'data-semantic-sentence': true,
      class: 'semantic-sentence',
    }, 0]
  },
})

export const SemanticParagraph = Mark.create({
  name: 'semanticParagraph',
  
  addAttributes() {
    return {
      paragraphId: { default: null },
      analysis: { default: null },
      mainIdea: { default: null },
      tone: { default: null },
      coherence: { default: null }
    }
  },
  
  parseHTML() {
    return [{ tag: 'div[data-semantic-paragraph]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-semantic-paragraph': true,
      class: 'semantic-paragraph',
    }, 0]
  },
})
```

### 2.2 AI Analysis Service

**Create:** `src/lib/ai/semantic-analysis.ts`

```typescript
import { createAIClient } from './client' // Template's AI client

export interface WordAnalysis {
  word: string
  meaning: string
  contextualMeaning: string
  sentenceContext: string
  paragraphContext: string
  pos: string // part of speech
  synonyms: string[]
  antonyms: string[]
  exampleUsage: string
}

export interface SentenceAnalysis {
  sentence: string
  mainIdea: string
  sentiment: 'positive' | 'negative' | 'neutral'
  complexity: 'simple' | 'medium' | 'complex'
  grammaticalStructure: string
  paragraphContext: string
  keyPhrases: string[]
}

export interface ParagraphAnalysis {
  paragraph: string
  mainIdea: string
  supportingIdeas: string[]
  tone: string
  coherence: number // 0-100
  transitionQuality: number
  suggestions: string[]
}

export class SemanticAnalyzer {
  private aiClient
  
  constructor() {
    this.aiClient = createAIClient({
      provider: 'anthropic', // hoặc từ env
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4000
    })
  }
  
  async analyzeWord(
    word: string, 
    sentenceContext: string, 
    paragraphContext: string
  ): Promise<WordAnalysis> {
    const prompt = `
Phân tích từ "${word}" trong ngữ cảnh sau:

Câu: "${sentenceContext}"
Đoạn: "${paragraphContext}"

Hãy trả về JSON với format:
{
  "word": "${word}",
  "meaning": "nghĩa gốc của từ",
  "contextualMeaning": "nghĩa trong ngữ cảnh này",
  "sentenceContext": "giải thích trong câu",
  "paragraphContext": "giải thích trong đoạn",
  "pos": "danh từ/động từ/tính từ/...",
  "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2"],
  "antonyms": ["từ trái nghĩa 1"],
  "exampleUsage": "ví dụ câu khác dùng từ này"
}

IMPORTANT: Chỉ trả về JSON, không có text khác.
`
    
    const response = await this.aiClient.generate(prompt)
    return JSON.parse(response)
  }
  
  async analyzeSentence(
    sentence: string, 
    paragraphContext: string
  ): Promise<SentenceAnalysis> {
    const prompt = `
Phân tích câu sau trong ngữ cảnh đoạn văn:

Câu: "${sentence}"
Đoạn: "${paragraphContext}"

Trả về JSON:
{
  "sentence": "${sentence}",
  "mainIdea": "ý chính của câu",
  "sentiment": "positive/negative/neutral",
  "complexity": "simple/medium/complex",
  "grammaticalStructure": "cấu trúc ngữ pháp",
  "paragraphContext": "vai trò trong đoạn",
  "keyPhrases": ["cụm từ quan trọng 1", "cụm từ 2"]
}

IMPORTANT: Chỉ trả về JSON.
`
    
    const response = await this.aiClient.generate(prompt)
    return JSON.parse(response)
  }
  
  async analyzeParagraph(paragraph: string): Promise<ParagraphAnalysis> {
    const prompt = `
Phân tích đoạn văn sau:

"${paragraph}"

Trả về JSON:
{
  "paragraph": "${paragraph}",
  "mainIdea": "ý chính của đoạn",
  "supportingIdeas": ["ý phụ 1", "ý phụ 2"],
  "tone": "formal/informal/academic/casual/...",
  "coherence": 85,
  "transitionQuality": 90,
  "suggestions": ["gợi ý cải thiện 1", "gợi ý 2"]
}

IMPORTANT: Chỉ trả về JSON.
`
    
    const response = await this.aiClient.generate(prompt)
    return JSON.parse(response)
  }
  
  // Batch analysis để tối ưu API calls
  async analyzeBatch(
    words: Array<{ word: string; sentence: string; paragraph: string }>
  ): Promise<WordAnalysis[]> {
    // Gộp nhiều từ vào 1 prompt để giảm API calls
    const prompt = `
Phân tích các từ sau (trả về array JSON):

${words.map((w, i) => `
${i + 1}. Từ: "${w.word}"
   Câu: "${w.sentence}"
   Đoạn: "${w.paragraph}"
`).join('\n')}

Trả về JSON array, mỗi item có format như trước.
IMPORTANT: Chỉ trả về JSON array.
`
    
    const response = await this.aiClient.generate(prompt)
    return JSON.parse(response)
  }
}
```

### 2.3 Analysis State Management

**Create:** `src/stores/analysisStore.ts` (Zustand)

```typescript
import { create } from 'zustand'

interface AnalysisState {
  // Cache analysis results
  wordAnalyses: Map<string, WordAnalysis>
  sentenceAnalyses: Map<string, SentenceAnalysis>
  paragraphAnalyses: Map<string, ParagraphAnalysis>
  
  // UI State
  selectedWord: string | null
  selectedSentence: string | null
  selectedParagraph: string | null
  
  // Loading states
  isAnalyzing: boolean
  analysisQueue: string[]
  
  // Actions
  setWordAnalysis: (wordId: string, analysis: WordAnalysis) => void
  setSentenceAnalysis: (sentenceId: string, analysis: SentenceAnalysis) => void
  setParagraphAnalysis: (paragraphId: string, analysis: ParagraphAnalysis) => void
  
  selectWord: (wordId: string) => void
  selectSentence: (sentenceId: string) => void
  selectParagraph: (paragraphId: string) => void
  
  clearSelection: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  wordAnalyses: new Map(),
  sentenceAnalyses: new Map(),
  paragraphAnalyses: new Map(),
  
  selectedWord: null,
  selectedSentence: null,
  selectedParagraph: null,
  
  isAnalyzing: false,
  analysisQueue: [],
  
  setWordAnalysis: (wordId, analysis) => set((state) => {
    const newMap = new Map(state.wordAnalyses)
    newMap.set(wordId, analysis)
    return { wordAnalyses: newMap }
  }),
  
  setSentenceAnalysis: (sentenceId, analysis) => set((state) => {
    const newMap = new Map(state.sentenceAnalyses)
    newMap.set(sentenceId, analysis)
    return { sentenceAnalyses: newMap }
  }),
  
  setParagraphAnalysis: (paragraphId, analysis) => set((state) => {
    const newMap = new Map(state.paragraphAnalyses)
    newMap.set(paragraphId, analysis)
    return { paragraphAnalyses: newMap }
  }),
  
  selectWord: (wordId) => set({ selectedWord: wordId }),
  selectSentence: (sentenceId) => set({ selectedSentence: sentenceId }),
  selectParagraph: (paragraphId) => set({ selectedParagraph: paragraphId }),
  
  clearSelection: () => set({ 
    selectedWord: null, 
    selectedSentence: null,
    selectedParagraph: null 
  }),
}))
```

---

## PHASE 3: REAL-TIME ANALYSIS ENGINE (Day 6-7)

### 3.1 Analysis Plugin

**Create:** `src/components/editor/plugins/analysisPlugin.ts`

```typescript
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { SemanticAnalyzer } from '@/lib/ai/semantic-analysis'

const analysisPluginKey = new PluginKey('semanticAnalysis')

export function createAnalysisPlugin(analyzer: SemanticAnalyzer) {
  let analysisTimeout: NodeJS.Timeout
  
  return new Plugin({
    key: analysisPluginKey,
    
    state: {
      init() {
        return {
          decorations: DecorationSet.empty,
          pendingAnalysis: false
        }
      },
      
      apply(tr, value, oldState, newState) {
        // Debounce analysis (chờ 2s sau khi user ngừng gõ)
        if (tr.docChanged) {
          clearTimeout(analysisTimeout)
          
          analysisTimeout = setTimeout(() => {
            // Trigger analysis
            analyzeDocument(newState.doc, analyzer)
          }, 2000)
        }
        
        return value
      }
    },
    
    props: {
      decorations(state) {
        return this.getState(state)?.decorations
      }
    }
  })
}

async function analyzeDocument(doc, analyzer: SemanticAnalyzer) {
  // Extract text structure
  const paragraphs = []
  const sentences = []
  const words = []
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'paragraph') {
      const paragraphText = node.textContent
      paragraphs.push({ text: paragraphText, pos })
      
      // Split into sentences
      const sentenceTexts = splitIntoSentences(paragraphText)
      sentenceTexts.forEach(sentenceText => {
        sentences.push({ 
          text: sentenceText, 
          paragraph: paragraphText,
          pos 
        })
        
        // Split into words
        const wordTexts = sentenceText.split(/\s+/)
        wordTexts.forEach(wordText => {
          words.push({
            word: wordText,
            sentence: sentenceText,
            paragraph: paragraphText
          })
        })
      })
    }
  })
  
  // Batch analysis (5 words at a time để tối ưu)
  const batchSize = 5
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    const analyses = await analyzer.analyzeBatch(batch)
    
    // Store in Zustand
    analyses.forEach((analysis, idx) => {
      const wordId = `word-${i + idx}`
      useAnalysisStore.getState().setWordAnalysis(wordId, analysis)
    })
  }
  
  // Analyze sentences (parallel)
  await Promise.all(
    sentences.map(async (s, idx) => {
      const analysis = await analyzer.analyzeSentence(s.text, s.paragraph)
      useAnalysisStore.getState().setSentenceAnalysis(`sentence-${idx}`, analysis)
    })
  )
  
  // Analyze paragraphs
  await Promise.all(
    paragraphs.map(async (p, idx) => {
      const analysis = await analyzer.analyzeParagraph(p.text)
      useAnalysisStore.getState().setParagraphAnalysis(`paragraph-${idx}`, analysis)
    })
  )
}

function splitIntoSentences(text: string): string[] {
  // Simple sentence splitter (có thể dùng thư viện tốt hơn)
  return text.match(/[^.!?]+[.!?]+/g) || [text]
}
```

### 3.2 Editor with Analysis

**Create:** `src/components/editor/SemanticEditor.tsx`

```tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { SemanticWord, SemanticSentence, SemanticParagraph } from './extensions/SemanticAnalysis'
import { SemanticAnalyzer } from '@/lib/ai/semantic-analysis'
import { createAnalysisPlugin } from './plugins/analysisPlugin'
import { useState, useEffect } from 'react'
import { AnalysisSidebar } from './AnalysisSidebar'

export default function SemanticEditor({ documentId }: { documentId?: string }) {
  const [analyzer] = useState(() => new SemanticAnalyzer())
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      SemanticWord,
      SemanticSentence,
      SemanticParagraph,
    ],
    content: '<p>Bắt đầu viết... AI sẽ phân tích ngữ nghĩa của bạn.</p>',
    
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[500px] p-6',
      },
      
      // Handle click on semantic words
      handleClickOn: (view, pos, node, nodePos, event) => {
        const target = event.target as HTMLElement
        
        if (target.hasAttribute('data-semantic-word')) {
          const wordId = target.getAttribute('data-word-id')
          useAnalysisStore.getState().selectWord(wordId)
        }
        
        if (target.hasAttribute('data-semantic-sentence')) {
          const sentenceId = target.getAttribute('data-sentence-id')
          useAnalysisStore.getState().selectSentence(sentenceId)
        }
      }
    },
    
    onCreate: ({ editor }) => {
      // Add analysis plugin
      editor.view.updateState(
        editor.view.state.reconfigure({
          plugins: [
            ...editor.view.state.plugins,
            createAnalysisPlugin(analyzer)
          ]
        })
      )
    }
  })
  
  return (
    <div className="flex h-screen">
      {/* Main Editor */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
      
      {/* Analysis Sidebar */}
      <AnalysisSidebar editor={editor} />
    </div>
  )
}
```

---

## PHASE 4: UI/UX - ANALYSIS DISPLAY (Day 8-9)

### 4.1 Analysis Sidebar

**Create:** `src/components/editor/AnalysisSidebar.tsx`

```tsx
'use client'
import { useAnalysisStore } from '@/stores/analysisStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AnalysisSidebar({ editor }) {
  const { 
    selectedWord, 
    selectedSentence,
    selectedParagraph,
    wordAnalyses,
    sentenceAnalyses,
    paragraphAnalyses,
    clearSelection
  } = useAnalysisStore()
  
  const wordAnalysis = selectedWord ? wordAnalyses.get(selectedWord) : null
  const sentenceAnalysis = selectedSentence ? sentenceAnalyses.get(selectedSentence) : null
  const paragraphAnalysis = selectedParagraph ? paragraphAnalyses.get(selectedParagraph) : null
  
  return (
    <div className="w-96 border-l bg-gray-50 dark:bg-gray-900 overflow-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Semantic Analysis</h2>
        {(selectedWord || selectedSentence || selectedParagraph) && (
          <button onClick={clearSelection} className="text-sm text-gray-500">
            Clear
          </button>
        )}
      </div>
      
      <Tabs defaultValue="word" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="word" className="flex-1">Từ</TabsTrigger>
          <TabsTrigger value="sentence" className="flex-1">Câu</TabsTrigger>
          <TabsTrigger value="paragraph" className="flex-1">Đoạn</TabsTrigger>
        </TabsList>
        
        {/* Word Analysis Tab */}
        <TabsContent value="word">
          {wordAnalysis ? (
            <WordAnalysisCard analysis={wordAnalysis} />
          ) : (
            <EmptyState text="Click vào từ để xem phân tích" />
          )}
        </TabsContent>
        
        {/* Sentence Analysis Tab */}
        <TabsContent value="sentence">
          {sentenceAnalysis ? (
            <SentenceAnalysisCard analysis={sentenceAnalysis} />
          ) : (
            <EmptyState text="Click vào câu để xem phân tích" />
          )}
        </TabsContent>
        
        {/* Paragraph Analysis Tab */}
        <TabsContent value="paragraph">
          {paragraphAnalysis ? (
            <ParagraphAnalysisCard analysis={paragraphAnalysis} />
          ) : (
            <EmptyState text="Click vào đoạn để xem phân tích" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WordAnalysisCard({ analysis }: { analysis: WordAnalysis }) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">{analysis.word}</h3>
        <Badge>{analysis.pos}</Badge>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Nghĩa gốc</h4>
        <p className="text-sm">{analysis.meaning}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Nghĩa trong ngữ cảnh
        </h4>
        <p className="text-sm">{analysis.contextualMeaning}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Giải thích trong câu
        </h4>
        <p className="text-sm italic">{analysis.sentenceContext}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Giải thích trong đoạn
        </h4>
        <p className="text-sm italic">{analysis.paragraphContext}</p>
      </div>
      
      {analysis.synonyms.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Từ đồng nghĩa
          </h4>
          <div className="flex flex-wrap gap-1">
            {analysis.synonyms.map((syn, i) => (
              <Badge key={i} variant="secondary">{syn}</Badge>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Ví dụ</h4>
        <p className="text-sm italic">{analysis.exampleUsage}</p>
      </div>
    </Card>
  )
}

function SentenceAnalysisCard({ analysis }: { analysis: SentenceAnalysis }) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <p className="text-sm italic mb-2">"{analysis.sentence}"</p>
        <div className="flex gap-2">
          <Badge>{analysis.sentiment}</Badge>
          <Badge variant="outline">{analysis.complexity}</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Ý chính</h4>
        <p className="text-sm">{analysis.mainIdea}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Cấu trúc ngữ pháp
        </h4>
        <p className="text-sm">{analysis.grammaticalStructure}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Vai trò trong đoạn
        </h4>
        <p className="text-sm">{analysis.paragraphContext}</p>
      </div>
      
      {analysis.keyPhrases.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Cụm từ quan trọng
          </h4>
          <div className="flex flex-wrap gap-1">
            {analysis.keyPhrases.map((phrase, i) => (
              <Badge key={i} variant="secondary">{phrase}</Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function ParagraphAnalysisCard({ analysis }: { analysis: ParagraphAnalysis }) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Ý chính</h4>
        <p className="text-sm font-medium">{analysis.mainIdea}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Ý phụ</h4>
        <ul className="list-disc list-inside space-y-1">
          {analysis.supportingIdeas.map((idea, i) => (
            <li key={i} className="text-sm">{idea}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Tone</h4>
        <Badge>{analysis.tone}</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Coherence Score
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${analysis.coherence}%` }}
              />
            </div>
            <span className="text-sm font-medium">{analysis.coherence}%</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Transition Quality
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${analysis.transitionQuality}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {analysis.transitionQuality}%
            </span>
          </div>
        </div>
      </div>
      
      {analysis.suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Gợi ý cải thiện
          </h4>
          <ul className="list-disc list-inside space-y-1">
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-amber-700">{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p className="text-sm">{text}</p>
    </div>
  )
}
```

### 4.2 Tooltip on Hover

**Create:** `src/components/editor/SemanticTooltip.tsx`

```tsx
'use client'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useAnalysisStore } from '@/stores/analysisStore'

export function SemanticTooltip({ 
  wordId, 
  children 
}: { 
  wordId: string
  children: React.ReactNode 
}) {
  const analysis = useAnalysisStore(
    (state) => state.wordAnalyses.get(wordId)
  )
  
  if (!analysis) return <>{children}</>
  
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3 max-w-xs z-50"
            sideOffset={5}
          >
            <div className="space-y-2">
              <div className="font-medium">{analysis.word}</div>
              <div className="text-sm text-gray-600">
                {analysis.contextualMeaning}
              </div>
              <div className="text-xs text-gray-500 italic">
                Click để xem chi tiết
              </div>
            </div>
            <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
```

---

## PHASE 5: DATABASE & PERSISTENCE (Day 10-11)

### 5.1 Database Schema

**Create:** `supabase/migrations/20240101_semantic_editor.sql`

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic analyses cache
CREATE TABLE semantic_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('word', 'sentence', 'paragraph')),
  target_text TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_updated ON documents(updated_at DESC);
CREATE INDEX idx_analyses_document ON semantic_analyses(document_id);
CREATE INDEX idx_analyses_type ON semantic_analyses(type);
CREATE INDEX idx_analyses_text ON semantic_analyses(target_text);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_analyses ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users view own docs"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create docs"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own docs"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own docs"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Analyses policies (via documents)
CREATE POLICY "Users view own analyses"
  ON semantic_analyses FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create analyses"
  ON semantic_analyses FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 5.2 API Routes

**Create:** `src/app/api/analyses/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/analyses?documentId=xxx&type=word
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')
  const type = searchParams.get('type')
  
  let query = supabase
    .from('semantic_analyses')
    .select('*')
    .eq('document_id', documentId)
  
  if (type) {
    query = query.eq('type', type)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/analyses - Cache analysis
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('semantic_analyses')
    .insert(body)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

### 5.3 Hooks with Cache

**Create:** `src/hooks/useSemanticAnalysis.ts`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

export function useCachedAnalyses(documentId: string, type?: string) {
  return useQuery({
    queryKey: ['analyses', documentId, type],
    queryFn: async () => {
      const params = new URLSearchParams({ documentId })
      if (type) params.append('type', type)
      
      const res = await fetch(`/api/analyses?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!documentId
  })
}

export function useCacheAnalysis() {
  return useMutation({
    mutationFn: async (data: {
      document_id: string
      type: 'word' | 'sentence' | 'paragraph'
      target_text: string
      analysis_data: any
      context?: any
    }) => {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to cache')
      return res.json()
    }
  })
}
```

---

## PHASE 6: OPTIMIZATION & PRODUCTION (Day 12-14)

### 6.1 Performance Optimizations

**1. Debounced Analysis**
```typescript
// Đợi 2s sau khi user ngừng gõ
const ANALYSIS_DEBOUNCE = 2000

// Batch analysis (5-10 items/request)
const BATCH_SIZE = 5
```

**2. Cache Strategy**
```typescript
// Cache analysis results
- Memory cache (Zustand) - instant access
- Database cache (Supabase) - persistent
- Check cache before calling AI API
```

**3. Progressive Analysis**
```typescript
// Priority order:
1. Analyze current paragraph first
2. Then analyze visible paragraphs
3. Finally analyze whole document in background
```

**4. Rate Limiting**
```typescript
// Template's AI module đã có rate limiting
// Configure in .env:
AI_RATE_LIMIT_PER_USER=100
AI_RATE_LIMIT_WINDOW=3600
```

### 6.2 Error Handling

```typescript
// In SemanticAnalyzer
try {
  const response = await this.aiClient.generate(prompt)
  return JSON.parse(response)
} catch (error) {
  // Fallback: return basic analysis
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    toast.error('Đã đạt giới hạn phân tích. Vui lòng thử lại sau.')
  }
  
  return {
    word,
    meaning: 'Không thể phân tích lúc này',
    contextualMeaning: 'Vui lòng thử lại',
    // ... fallback data
  }
}
```

### 6.3 Testing

**Unit Tests:** `tests/lib/semantic-analysis.test.ts`
```typescript
describe('SemanticAnalyzer', () => {
  it('should analyze word correctly', async () => {
    const analyzer = new SemanticAnalyzer()
    const result = await analyzer.analyzeWord(
      'chạy',
      'Tôi chạy nhanh.',
      'Tôi chạy nhanh để kịp giờ.'
    )
    expect(result.word).toBe('chạy')
    expect(result.pos).toBe('động từ')
  })
})
```

**E2E Tests:** `tests/e2e/editor.spec.ts`
```typescript
test('should show analysis on word click', async ({ page }) => {
  await page.goto('/editor/new')
  await page.fill('.tiptap', 'Test word')
  await page.click('[data-semantic-word]')
  await expect(page.locator('.word-analysis')).toBeVisible()
})
```

### 6.4 Monitoring

```typescript
// Track AI usage
- API calls count
- Token usage
- Cost tracking (template có sẵn)
- Response times

// Template's AI monitoring dashboard
npm run ai:usage-report
```

---

## TECH STACK SUMMARY

### Core
- **Editor:** Tiptap (custom marks + plugins)
- **AI:** Template's AI Module (Anthropic/OpenAI/Google)
- **Database:** Supabase PostgreSQL
- **Framework:** Next.js 16 App Router
- **Language:** TypeScript

### State Management
- **Server:** TanStack Query
- **Client:** Zustand (analysis cache)

### UI
- **Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Tooltips:** Radix UI

### AI Features
- Real-time semantic analysis
- Multi-level context (word → sentence → paragraph)
- Batch processing
- Result caching
- Rate limiting

---

## PROJECT STRUCTURE

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── editor/
│   │       ├── page.tsx              # Document list
│   │       ├── new/page.tsx          # New document
│   │       └── [id]/page.tsx         # Edit with AI analysis
│   └── api/
│       ├── documents/                # CRUD
│       └── analyses/                 # Cache analyses
├── components/
│   ├── editor/
│   │   ├── SemanticEditor.tsx       # Main editor
│   │   ├── AnalysisSidebar.tsx      # Analysis display
│   │   ├── SemanticTooltip.tsx      # Hover tooltips
│   │   ├── extensions/
│   │   │   └── SemanticAnalysis.ts  # Custom marks
│   │   └── plugins/
│   │       └── analysisPlugin.ts    # Real-time analysis
│   └── ui/                           # Shadcn components
├── lib/
│   └── ai/
│       ├── client.ts                 # Template's AI client
│       └── semantic-analysis.ts      # Analysis service
├── hooks/
│   ├── useDocuments.ts
│   ├── useSemanticAnalysis.ts
│   └── useAutoSave.ts
├── stores/
│   └── analysisStore.ts              # Zustand store
└── types/
    └── semantic.ts                   # TypeScript types
```

---

## DEVELOPMENT TIMELINE

| Phase | Days | Focus |
|-------|------|-------|
| Phase 1 | 1-2 | Setup + Core Editor |
| Phase 2 | 3-5 | AI Analysis System |
| Phase 3 | 6-7 | Real-time Engine |
| Phase 4 | 8-9 | UI/UX Display |
| Phase 5 | 10-11 | Database + Cache |
| Phase 6 | 12-14 | Optimization + Production |

**Total: 12-14 ngày**

---

## AI PROVIDER COMPARISON

### Anthropic Claude (Recommended)
- ✅ Best context understanding
- ✅ 200K tokens context
- ✅ Structured output tốt
- ✅ Accurate semantic analysis
- 💰 $3/M input, $15/M output tokens

### OpenAI GPT-4
- ✅ Fast response
- ✅ Good analysis
- ⚠️ 128K tokens context
- 💰 $2.50/M input, $10/M output

### Google Gemini
- ✅ 1M tokens context (huge!)
- ✅ Free tier generous
- ⚠️ Output quality varies
- 💰 Cheaper pricing

**Recommendation:** Anthropic Claude Sonnet cho semantic analysis

---

## COST ESTIMATION

**Assumptions:**
- 1000 words = ~1500 tokens
- Phân tích 1 word: ~500 tokens (input + output)
- Document 1000 words = 1000 analyses
- Total: ~500K tokens per document

**Cost per document (Anthropic):**
- Input: 500K × $3/1M = $1.50
- Output: 500K × $15/1M = $7.50
- **Total: ~$9/document full analysis**

**Optimization:**
- Cache results: 90% cost reduction
- Batch analysis: 50% faster
- Progressive loading: Better UX
- **Real cost: ~$1-2/document** (với cache)

---

## DEPLOYMENT

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Choose one or multiple)
ANTHROPIC_API_KEY=          # Recommended
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=production

# AI Config
AI_DEFAULT_PROVIDER=anthropic
AI_DEFAULT_MODEL=claude-sonnet-4-20250514
AI_MAX_TOKENS=4000
AI_RATE_LIMIT_PER_USER=100
```

### Vercel Deployment
```bash
# Connect GitHub repo
# Set environment variables
# Auto-deploy on push to main
```

---

## NEXT STEPS

### Week 1: Foundation
1. **Day 1-2:** Setup + Basic editor
2. **Day 3-5:** AI analysis system + Custom marks

### Week 2: Features
3. **Day 6-7:** Real-time analysis engine
4. **Day 8-9:** UI/UX + Sidebar
5. **Day 10-11:** Database + Caching

### Week 3: Polish
6. **Day 12-14:** Optimization + Testing + Deploy

---

## ADVANCED FEATURES (Future)

### V2 Features
- [ ] Multi-language support (English, Vietnamese, etc.)
- [ ] Grammar checking integration
- [ ] Style suggestions (tone, formality)
- [ ] Readability scores
- [ ] Compare versions
- [ ] Export analysis reports
- [ ] AI writing assistant
- [ ] Collaboration with shared analyses

### V3 Features
- [ ] Custom AI models (fine-tuned)
- [ ] Voice-to-text with analysis
- [ ] Real-time collaboration
- [ ] Advanced visualizations
- [ ] Plugin system

---

## RESOURCES

### Documentation
- **Tiptap:** https://tiptap.dev/docs
- **Template:** https://github.com/maemreyo/nextjs-supabase-template
- **Anthropic:** https://docs.anthropic.com
- **Supabase:** https://supabase.com/docs

### Examples
- **Tiptap Decorations:** https://tiptap.dev/examples/savvy
- **Custom Marks:** https://tiptap.dev/docs/guides/create-mark
- **ProseMirror Plugins:** https://prosemirror.net/docs/guide/

---

## NOTES

✅ **Key Success Factors:**
- Dùng Anthropic Claude cho semantic analysis
- Cache aggressively để giảm chi phí
- Batch processing để tối ưu API calls
- Progressive analysis cho UX tốt
- Debounce để tránh spam AI

⚠️ **Challenges:**
- Cost management (giải quyết bằng cache)
- Rate limiting (template đã có)
- Complex UI state (Zustand + TanStack Query)
- Performance với large documents (progressive loading)

🎯 **Success Metrics:**
- Analysis accuracy > 90%
- Response time < 3s
- Cost per document < $2
- User satisfaction > 4/5

**LET'S BUILD!** 🚀