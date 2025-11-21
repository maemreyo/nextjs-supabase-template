# UI Components Architecture - AI Semantic Analysis Editor

## Tổng quan

Tài liệu này mô tả kiến trúc UI components cho hệ thống AI Semantic Analysis Editor, được thiết kế để hiển thị rich fields từ các interface TypeScript mới (WordAnalysis, SentenceAnalysis, ParagraphAnalysis).

## Component Hierarchy

```
App
├── SemanticEditor
│   ├── EditorContent (Tiptap)
│   ├── AnalysisSidebar
│   │   ├── AnalysisTabs
│   │   │   ├── WordAnalysisDisplay
│   │   │   │   ├── WordMetaSection
│   │   │   │   ├── WordDefinitionsSection
│   │   │   │   ├── InferenceStrategySection
│   │   │   │   ├── SynonymAntonymList
│   │   │   │   └── WordUsageSection
│   │   │   ├── SentenceAnalysisDisplay
│   │   │   │   ├── SentenceMetaSection
│   │   │   │   ├── SemanticsSection
│   │   │   │   ├── GrammarBreakdownSection
│   │   │   │   ├── ContextualRoleSection
│   │   │   │   ├── KeyComponentsSection
│   │   │   │   ├── RewriteSuggestions
│   │   │   │   └── TranslationSection
│   │   │   └── ParagraphAnalysisDisplay
│   │   │       ├── ParagraphMetaSection
│   │   │       ├── ContentAnalysisSection
│   │   │       ├── StructureBreakdown
│   │   │       ├── CoherenceCohesionSection
│   │   │       ├── StylisticEvaluationSection
│   │   │       └── ConstructiveFeedback
│   │   └── AnalysisHistory
│   └── SemanticTooltip
├── AnalysisCard (Reusable)
├── AnalysisPanel (Container)
└── LoadingStates & ErrorComponents
```

## 1. WordAnalysisDisplay Component

### Mục đích
Hiển thị chi tiết phân tích từ với rich fields từ interface WordAnalysis mới.

### Props Interface
```typescript
interface WordAnalysisDisplayProps {
  analysis: WordAnalysis;
  isLoading?: boolean;
  error?: string;
  onSynonymClick?: (word: string) => void;
  onAntonymClick?: (word: string) => void;
}
```

### Component Structure
```tsx
export function WordAnalysisDisplay({ 
  analysis, 
  isLoading, 
  error, 
  onSynonymClick, 
  onAntonymClick 
}: WordAnalysisDisplayProps) {
  if (isLoading) return <WordAnalysisSkeleton />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <div className="space-y-6">
      <WordMetaSection meta={analysis.meta} />
      <WordDefinitionsSection definitions={analysis.definitions} />
      <InferenceStrategySection strategy={analysis.inference_strategy} />
      <SynonymAntonymList 
        synonyms={analysis.relations.synonyms}
        antonyms={analysis.relations.antonyms}
        onSynonymClick={onSynonymClick}
        onAntonymClick={onAntonymClick}
      />
      <WordUsageSection usage={analysis.usage} />
    </div>
  )
}
```

### Sub-components

#### WordMetaSection
```tsx
interface WordMetaSectionProps {
  meta: WordAnalysis['meta'];
}

export function WordMetaSection({ meta }: WordMetaSectionProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold">{meta.word}</h3>
        <Button variant="ghost" size="sm">
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{meta.pos}</Badge>
          <Badge variant="outline">{meta.cefr}</Badge>
          <Badge>{meta.tone}</Badge>
        </div>
        
        <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
          {meta.ipa}
        </div>
      </div>
    </Card>
  )
}
```

#### WordDefinitionsSection
```tsx
interface WordDefinitionsSectionProps {
  definitions: WordAnalysis['definitions'];
}

export function WordDefinitionsSection({ definitions }: WordDefinitionsSectionProps) {
  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3">Định nghĩa</h4>
      
      <div className="space-y-3">
        <div>
          <h5 className="text-sm font-medium text-gray-600 mb-1">Nghĩa gốc</h5>
          <p className="text-sm">{definitions.root_meaning}</p>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-gray-600 mb-1">Nghĩa trong ngữ cảnh</h5>
          <p className="text-sm bg-blue-50 p-2 rounded">{definitions.context_meaning}</p>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-gray-600 mb-1">Dịch nghĩa</h5>
          <p className="text-sm font-medium">{definitions.vietnamese_translation}</p>
        </div>
      </div>
    </Card>
  )
}
```

#### InferenceStrategySection
```tsx
interface InferenceStrategySectionProps {
  strategy: WordAnalysis['inference_strategy'];
}

export function InferenceStrategySection({ strategy }: InferenceStrategySectionProps) {
  return (
    <Card className="p-4 bg-amber-50 border-amber-200">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-600" />
        Chiến lược suy luận
      </h4>
      
      <div className="space-y-2">
        <div>
          <h5 className="text-sm font-medium mb-1">Dấu hiệu nhận biết:</h5>
          <p className="text-sm">{strategy.clues}</p>
        </div>
        
        <div>
          <h5 className="text-sm font-medium mb-1">Cách suy luận:</h5>
          <p className="text-sm">{strategy.reasoning}</p>
        </div>
      </div>
    </Card>
  )
}
```

## 2. SentenceAnalysisDisplay Component

### Mục đích
Hiển thị chi tiết phân tích câu với rich fields từ interface SentenceAnalysis mới.

### Props Interface
```typescript
interface SentenceAnalysisDisplayProps {
  analysis: SentenceAnalysis;
  isLoading?: boolean;
  error?: string;
  onRewriteApply?: (text: string) => void;
}
```

### Component Structure
```tsx
export function SentenceAnalysisDisplay({ 
  analysis, 
  isLoading, 
  error, 
  onRewriteApply 
}: SentenceAnalysisDisplayProps) {
  if (isLoading) return <SentenceAnalysisSkeleton />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <div className="space-y-6">
      <SentenceMetaSection meta={analysis.meta} />
      <SemanticsSection semantics={analysis.semantics} />
      <GrammarBreakdownSection grammar={analysis.grammar_breakdown} />
      <ContextualRoleSection role={analysis.contextual_role} />
      <KeyComponentsSection components={analysis.key_components} />
      <RewriteSuggestions 
        suggestions={analysis.rewrite_suggestions}
        onApply={onRewriteApply}
      />
      <TranslationSection translation={analysis.translation} />
    </div>
  )
}
```

### Sub-components

#### RewriteSuggestions
```tsx
interface RewriteSuggestionsProps {
  suggestions: SentenceAnalysis['rewrite_suggestions'];
  onApply?: (text: string) => void;
}

export function RewriteSuggestions({ suggestions, onApply }: RewriteSuggestionsProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  
  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3">Gợi ý viết lại</h4>
      
      <Tabs value={selectedStyle} onValueChange={setSelectedStyle}>
        <TabsList className="grid w-full grid-cols-3">
          {suggestions.map((suggestion) => (
            <TabsTrigger key={suggestion.style} value={suggestion.style}>
              {suggestion.style}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {suggestions.map((suggestion) => (
          <TabsContent key={suggestion.style} value={suggestion.style} className="mt-3">
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                <p className="text-sm italic">"{suggestion.text}"</p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium">Thay đổi:</p>
                <p>{suggestion.change_log}</p>
              </div>
              
              {onApply && (
                <Button 
                  size="sm" 
                  onClick={() => onApply(suggestion.text)}
                  className="mt-2"
                >
                  Áp dụng phiên bản này
                </Button>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
```

## 3. ParagraphAnalysisDisplay Component

### Mục đích
Hiển thị chi tiết phân tích đoạn văn với rich fields từ interface ParagraphAnalysis mới.

### Props Interface
```typescript
interface ParagraphAnalysisDisplayProps {
  analysis: ParagraphAnalysis;
  isLoading?: boolean;
  error?: string;
  onFeedbackApply?: (text: string) => void;
}
```

### Component Structure
```tsx
export function ParagraphAnalysisDisplay({ 
  analysis, 
  isLoading, 
  error, 
  onFeedbackApply 
}: ParagraphAnalysisDisplayProps) {
  if (isLoading) return <ParagraphAnalysisSkeleton />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <div className="space-y-6">
      <ParagraphMetaSection meta={analysis.meta} />
      <ContentAnalysisSection content={analysis.content_analysis} />
      <StructureBreakdown structure={analysis.structure_breakdown} />
      <CoherenceCohesionSection coherence={analysis.coherence_and_cohesion} />
      <StylisticEvaluationSection stylistic={analysis.stylistic_evaluation} />
      <ConstructiveFeedback 
        feedback={analysis.constructive_feedback}
        onApply={onFeedbackApply}
      />
    </div>
  )
}
```

### Sub-components

#### StructureBreakdown
```tsx
interface StructureBreakdownProps {
  structure: ParagraphAnalysis['structure_breakdown'];
}

export function StructureBreakdown({ structure }: StructureBreakdownProps) {
  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3">Phân tích cấu trúc</h4>
      
      <div className="space-y-3">
        {structure.map((item, index) => (
          <div key={index} className="border-l-2 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Câu {item.sentence_index}
              </Badge>
              <span className="text-sm text-gray-500">
                "{item.snippet}..."
              </span>
            </div>
            
            <div className="bg-blue-50 px-2 py-1 rounded inline-block mb-2">
              <span className="text-xs font-medium">{item.role}</span>
            </div>
            
            <p className="text-sm">{item.analysis}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

#### ConstructiveFeedback
```tsx
interface ConstructiveFeedbackProps {
  feedback: ParagraphAnalysis['constructive_feedback'];
  onApply?: (text: string) => void;
}

export function ConstructiveFeedback({ feedback, onApply }: ConstructiveFeedbackProps) {
  const [showBetterVersion, setShowBetterVersion] = useState(false)
  
  return (
    <Card className="p-4 bg-green-50 border-green-200">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        Góp ý xây dựng
      </h4>
      
      <div className="space-y-4">
        {feedback.critiques.map((critique, index) => (
          <div key={index} className="border-l-2 border-orange-400 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {critique.issue_type}
              </Badge>
            </div>
            
            <p className="text-sm mb-2">{critique.description}</p>
            
            <div className="bg-orange-50 p-2 rounded">
              <p className="text-xs font-medium">Gợi ý:</p>
              <p className="text-xs">{critique.suggestion}</p>
            </div>
          </div>
        ))}
        
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBetterVersion(!showBetterVersion)}
            className="mb-3"
          >
            {showBetterVersion ? 'Ẩn' : 'Hiện'} phiên bản cải tiến
          </Button>
          
          {showBetterVersion && (
            <div className="bg-green-100 p-4 rounded border-l-4 border-green-500">
              <p className="text-sm font-medium mb-2">Phiên bản cải tiến:</p>
              <p className="text-sm italic">"{feedback.better_version}"</p>
              
              {onApply && (
                <Button 
                  size="sm" 
                  onClick={() => onApply(feedback.better_version)}
                  className="mt-3"
                >
                  Áp dụng phiên bản này
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
```

## 4. SynonymAntonymList Component

### Mục đích
Component tái sử dụng để hiển thị danh sách từ đồng nghĩa và trái nghĩa.

### Props Interface
```typescript
interface SynonymAntonymListProps {
  synonyms: WordAnalysis['relations']['synonyms'];
  antonyms: WordAnalysis['relations']['antonyms'];
  onSynonymClick?: (word: string) => void;
  onAntonymClick?: (word: string) => void;
  maxItems?: number;
}
```

### Component Implementation
```tsx
export function SynonymAntonymList({ 
  synonyms, 
  antonyms, 
  onSynonymClick, 
  onAntonymClick,
  maxItems = 5 
}: SynonymAntonymListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {synonyms.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-green-700">
            Từ đồng nghĩa ({synonyms.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {synonyms.slice(0, maxItems).map((synonym, index) => (
              <div 
                key={index}
                className="border rounded p-2 hover:bg-green-50 cursor-pointer transition-colors"
                onClick={() => onSynonymClick?.(synonym.word)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{synonym.word}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {synonym.ipa}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mt-1">
                  {synonym.meaning_en}
                </p>
                <p className="text-xs mt-1">
                  {synonym.meaning_vi}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {antonyms.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-red-700">
            Từ trái nghĩa ({antonyms.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {antonyms.slice(0, maxItems).map((antonym, index) => (
              <div 
                key={index}
                className="border rounded p-2 hover:bg-red-50 cursor-pointer transition-colors"
                onClick={() => onAntonymClick?.(antonym.word)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{antonym.word}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {antonym.ipa}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mt-1">
                  {antonym.meaning_en}
                </p>
                <p className="text-xs mt-1">
                  {antonym.meaning_vi}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

## 5. Cập nhật Components hiện có

### AnalysisCard Component
```tsx
interface AnalysisCardProps {
  title: string;
  children: React.ReactNode;
  type: 'word' | 'sentence' | 'paragraph';
  isLoading?: boolean;
  error?: string;
  actions?: React.ReactNode;
}

export function AnalysisCard({ 
  title, 
  children, 
  type, 
  isLoading, 
  error, 
  actions 
}: AnalysisCardProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'word': return 'border-blue-200 bg-blue-50'
      case 'sentence': return 'border-green-200 bg-green-50'
      case 'paragraph': return 'border-purple-200 bg-purple-50'
      default: return 'border-gray-200'
    }
  }
  
  const getTypeIcon = () => {
    switch (type) {
      case 'word': return <BookOpen className="h-4 w-4 text-blue-600" />
      case 'sentence': return <FileText className="h-4 w-4 text-green-600" />
      case 'paragraph': return <FilePlus className="h-4 w-4 text-purple-600" />
      default: return null
    }
  }
  
  return (
    <Card className={`w-full ${getTypeColor()}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
          {actions}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading && <AnalysisSkeleton type={type} />}
        {error && <ErrorMessage message={error} />}
        {!isLoading && !error && children}
      </CardContent>
    </Card>
  )
}
```

### AnalysisPanel Component
```tsx
interface AnalysisPanelProps {
  documentId: string;
  selectedText?: string;
  analysisType: 'word' | 'sentence' | 'paragraph';
  onAnalysisTypeChange: (type: 'word' | 'sentence' | 'paragraph') => void;
}

export function AnalysisPanel({ 
  documentId, 
  selectedText, 
  analysisType, 
  onAnalysisTypeChange 
}: AnalysisPanelProps) {
  return (
    <div className="w-96 border-l bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Analysis</h2>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <AnalysisTabs
          activeType={analysisType}
          onTypeChange={onAnalysisTypeChange}
        />
        
        {selectedText && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
            <p className="text-sm italic">"{selectedText}"</p>
          </div>
        )}
        
        <div className="min-h-[400px]">
          {analysisType === 'word' && (
            <WordAnalysisDisplay 
              analysis={wordAnalysis}
              onSynonymClick={handleSynonymClick}
            />
          )}
          
          {analysisType === 'sentence' && (
            <SentenceAnalysisDisplay 
              analysis={sentenceAnalysis}
              onRewriteApply={handleRewriteApply}
            />
          )}
          
          {analysisType === 'paragraph' && (
            <ParagraphAnalysisDisplay 
              analysis={paragraphAnalysis}
              onFeedbackApply={handleFeedbackApply}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

### AnalysisTabs Component
```tsx
interface AnalysisTabsProps {
  activeType: 'word' | 'sentence' | 'paragraph';
  onTypeChange: (type: 'word' | 'sentence' | 'paragraph') => void;
}

export function AnalysisTabs({ activeType, onTypeChange }: AnalysisTabsProps) {
  return (
    <Tabs value={activeType} onValueChange={onTypeChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="word" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Từ
        </TabsTrigger>
        
        <TabsTrigger value="sentence" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Câu
        </TabsTrigger>
        
        <TabsTrigger value="paragraph" className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Đoạn
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

## 6. Responsive Design & Accessibility

### Mobile-First Design
```tsx
// Responsive wrapper cho mobile
export function ResponsiveAnalysisPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50">
            <BarChart3 className="h-4 w-4" />
            Analysis
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>AI Analysis</SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 overflow-auto">
            {children}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Desktop version */}
      <div className="hidden lg:block">
        {children}
      </div>
    </div>
  )
}
```

### Accessibility Features
```tsx
// ARIA labels và keyboard navigation
export function AccessibleAnalysisCard({ children, ...props }: AnalysisCardProps) {
  return (
    <Card 
      role="region"
      aria-labelledby={`analysis-title-${props.type}`}
      aria-describedby={`analysis-desc-${props.type}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Handle activation
        }
      }}
      {...props}
    >
      <CardHeader>
        <CardTitle id={`analysis-title-${props.type}`}>
          {props.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent id={`analysis-desc-${props.type}`}>
        {children}
      </CardContent>
    </Card>
  )
}
```

## 7. Performance Optimizations

### Lazy Loading
```tsx
// Lazy load components với React.lazy
const WordAnalysisDisplay = React.lazy(() => import('./WordAnalysisDisplay'))
const SentenceAnalysisDisplay = React.lazy(() => import('./SentenceAnalysisDisplay'))
const ParagraphAnalysisDisplay = React.lazy(() => import('./ParagraphAnalysisDisplay'))

export function OptimizedAnalysisPanel({ analysisType }: { analysisType: string }) {
  return (
    <Suspense fallback={<AnalysisSkeleton type={analysisType as any} />}>
      {analysisType === 'word' && <WordAnalysisDisplay />}
      {analysisType === 'sentence' && <SentenceAnalysisDisplay />}
      {analysisType === 'paragraph' && <ParagraphAnalysisDisplay />}
    </Suspense>
  )
}
```

### Virtualization cho danh sách dài
```tsx
// Virtual list cho synonyms/antonyms
import { FixedSizeList as List } from 'react-window'

export function VirtualizedWordList({ words }: { words: any[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <WordListItem word={words[index]} />
    </div>
  )
  
  return (
    <List
      height={300}
      itemCount={words.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

## 8. State Management với Zustand

### Analysis Store
```typescript
interface AnalysisStore {
  // Cache states
  wordAnalyses: Map<string, WordAnalysis>
  sentenceAnalyses: Map<string, SentenceAnalysis>
  paragraphAnalyses: Map<string, ParagraphAnalysis>
  
  // UI states
  selectedWord: string | null
  selectedSentence: string | null
  selectedParagraph: string | null
  activeTab: 'word' | 'sentence' | 'paragraph'
  
  // Loading states
  isAnalyzing: boolean
  analysisQueue: Array<{
    id: string
    type: 'word' | 'sentence' | 'paragraph'
    data: any
  }>
  
  // Actions
  setWordAnalysis: (id: string, analysis: WordAnalysis) => void
  setSentenceAnalysis: (id: string, analysis: SentenceAnalysis) => void
  setParagraphAnalysis: (id: string, analysis: ParagraphAnalysis) => void
  
  selectWord: (id: string) => void
  selectSentence: (id: string) => void
  selectParagraph: (id: string) => void
  setActiveTab: (tab: 'word' | 'sentence' | 'paragraph') => void
  
  clearSelection: () => void
  clearCache: () => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  wordAnalyses: new Map(),
  sentenceAnalyses: new Map(),
  paragraphAnalyses: new Map(),
  
  selectedWord: null,
  selectedSentence: null,
  selectedParagraph: null,
  activeTab: 'word',
  
  isAnalyzing: false,
  analysisQueue: [],
  
  setWordAnalysis: (id, analysis) => set((state) => {
    const newMap = new Map(state.wordAnalyses)
    newMap.set(id, analysis)
    return { wordAnalyses: newMap }
  }),
  
  setSentenceAnalysis: (id, analysis) => set((state) => {
    const newMap = new Map(state.sentenceAnalyses)
    newMap.set(id, analysis)
    return { sentenceAnalyses: newMap }
  }),
  
  setParagraphAnalysis: (id, analysis) => set((state) => {
    const newMap = new Map(state.paragraphAnalyses)
    newMap.set(id, analysis)
    return { paragraphAnalyses: newMap }
  }),
  
  selectWord: (id) => set({ 
    selectedWord: id, 
    activeTab: 'word' 
  }),
  
  selectSentence: (id) => set({ 
    selectedSentence: id, 
    activeTab: 'sentence' 
  }),
  
  selectParagraph: (id) => set({ 
    selectedParagraph: id, 
    activeTab: 'paragraph' 
  }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  clearSelection: () => set({ 
    selectedWord: null, 
    selectedSentence: null,
    selectedParagraph: null 
  }),
  
  clearCache: () => set({
    wordAnalyses: new Map(),
    sentenceAnalyses: new Map(),
    paragraphAnalyses: new Map()
  })
}))
```

## 9. Data Fetching với TanStack Query

### Custom Hooks
```typescript
// Hook cho word analysis
export function useWordAnalysis(
  word: string, 
  sentenceContext: string, 
  paragraphContext: string
) {
  return useQuery({
    queryKey: ['word-analysis', word, sentenceContext, paragraphContext],
    queryFn: async () => {
      const response = await fetch('/api/ai/analyze-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, sentenceContext, paragraphContext })
      })
      
      if (!response.ok) throw new Error('Failed to analyze word')
      return response.json() as Promise<WordAnalysis>
    },
    enabled: !!word && !!sentenceContext,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

// Hook cho sentence analysis
export function useSentenceAnalysis(
  sentence: string, 
  paragraphContext?: string
) {
  return useQuery({
    queryKey: ['sentence-analysis', sentence, paragraphContext],
    queryFn: async () => {
      const response = await fetch('/api/ai/analyze-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, paragraphContext })
      })
      
      if (!response.ok) throw new Error('Failed to analyze sentence')
      return response.json() as Promise<SentenceAnalysis>
    },
    enabled: !!sentence,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60 * 24,
  })
}

// Hook cho paragraph analysis
export function useParagraphAnalysis(paragraph: string) {
  return useQuery({
    queryKey: ['paragraph-analysis', paragraph],
    queryFn: async () => {
      const response = await fetch('/api/ai/analyze-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraph })
      })
      
      if (!response.ok) throw new Error('Failed to analyze paragraph')
      return response.json() as Promise<ParagraphAnalysis>
    },
    enabled: !!paragraph,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60 * 24,
  })
}
```

### Mutation Hooks
```typescript
// Hook cho batch analysis
export function useBatchAnalysis() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (items: Array<{
      type: 'word' | 'sentence' | 'paragraph'
      data: any
    }>) => {
      const response = await fetch('/api/ai/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      
      if (!response.ok) throw new Error('Failed to analyze batch')
      return response.json()
    },
    onSuccess: (data) => {
      // Update cache với kết quả batch
      data.results.forEach((result: any) => {
        queryClient.setQueryData(
          [`${result.type}-analysis`, ...result.queryKey],
          result.analysis
        )
      })
    },
  })
}
```

## 10. Error Handling & Loading States

### Error Boundary
```tsx
export class AnalysisErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analysis Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Đã xảy ra lỗi khi phân tích
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'Lỗi không xác định'}
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Thử lại
            </Button>
          </div>
        </Card>
      )
    }
    
    return this.props.children
  }
}
```

### Loading Skeletons
```tsx
export function AnalysisSkeleton({ type }: { type: 'word' | 'sentence' | 'paragraph' }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      
      {type === 'word' && (
        <>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </>
      )}
      
      {type === 'sentence' && (
        <>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
        </>
      )}
      
      {type === 'paragraph' && (
        <>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-48 bg-gray-200 rounded w-full"></div>
        </>
      )}
    </div>
  )
}
```

## 11. Styling với Tailwind CSS

### Custom Components Styles
```css
/* src/styles/analysis.css */
.analysis-card {
  @apply transition-all duration-200 ease-in-out;
}

.analysis-card:hover {
  @apply shadow-lg transform scale-[1.02];
}

.word-highlight {
  @apply bg-blue-100 dark:bg-blue-900 px-1 rounded cursor-help;
}

.sentence-highlight {
  @apply bg-green-100 dark:bg-green-900 px-1 rounded cursor-help;
}

.paragraph-highlight {
  @apply bg-purple-100 dark:bg-purple-900 px-1 rounded cursor-help;
}

.synonym-item {
  @apply hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors;
}

.antonym-item {
  @apply hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors;
}

.rewrite-suggestion {
  @apply border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.feedback-item {
  @apply border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20;
}

.better-version {
  @apply border-l-4 border-green-500 bg-green-100 dark:bg-green-900/20;
}
```

### Responsive Utilities
```css
/* Mobile-first responsive utilities */
@media (max-width: 768px) {
  .analysis-panel {
    @apply fixed inset-x-0 bottom-0 h-[70vh] rounded-t-xl shadow-2xl;
  }
  
  .analysis-sidebar {
    @apply hidden;
  }
}

@media (min-width: 1024px) {
  .analysis-panel {
    @apply relative inset-auto h-auto rounded-none shadow-none;
  }
  
  .analysis-sidebar {
    @apply block;
  }
}
```

## 12. Testing Strategy

### Component Testing
```typescript
// __tests__/components/WordAnalysisDisplay.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { WordAnalysisDisplay } from '../WordAnalysisDisplay'

const mockAnalysis: WordAnalysis = {
  meta: {
    word: 'sophisticated',
    ipa: '/səˈfɪstɪkeɪtɪd/',
    pos: 'Adjective',
    cefr: 'C1',
    tone: 'Formal'
  },
  definitions: {
    root_meaning: 'phức tạp, tinh vi',
    context_meaning: 'phức tạp và thông minh',
    vietnamese_translation: 'tinh vi'
  },
  // ... rest of mock data
}

describe('WordAnalysisDisplay', () => {
  it('renders word analysis correctly', () => {
    render(<WordAnalysisDisplay analysis={mockAnalysis} />)
    
    expect(screen.getByText('sophisticated')).toBeInTheDocument()
    expect(screen.getByText('/səˈfɪstɪkeɪtɪd/')).toBeInTheDocument()
    expect(screen.getByText('Adjective')).toBeInTheDocument()
  })
  
  it('calls onSynonymClick when synonym is clicked', () => {
    const onSynonymClick = jest.fn()
    render(
      <WordAnalysisDisplay 
        analysis={mockAnalysis} 
        onSynonymClick={onSynonymClick} 
      />
    )
    
    fireEvent.click(screen.getByText('advanced'))
    expect(onSynonymClick).toHaveBeenCalledWith('advanced')
  })
})
```

### Integration Testing
```typescript
// __tests__/integration/AnalysisFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnalysisPanel } from '../AnalysisPanel'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

describe('Analysis Flow Integration', () => {
  it('analyzes word and displays results', async () => {
    const queryClient = createTestQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisPanel 
          documentId="test-doc"
          analysisType="word"
          onAnalysisTypeChange={() => {}}
        />
      </QueryClientProvider>
    )
    
    // Mock API call
    // ... setup mocks
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('sophisticated')).toBeInTheDocument()
    })
  })
})
```

## 13. Deployment Considerations

### Code Splitting
```typescript
// Dynamic imports cho better performance
const WordAnalysisDisplay = dynamic(
  () => import('../components/WordAnalysisDisplay'),
  { 
    loading: () => <AnalysisSkeleton type="word" />,
    ssr: false 
  }
)

const SentenceAnalysisDisplay = dynamic(
  () => import('../components/SentenceAnalysisDisplay'),
  { 
    loading: () => <AnalysisSkeleton type="sentence" />,
    ssr: false 
  }
)
```

### Bundle Optimization
```typescript
// Tree-shaking cho unused components
export {
  WordAnalysisDisplay,
  SentenceAnalysisDisplay,
  ParagraphAnalysisDisplay,
  SynonymAntonymList,
  RewriteSuggestions,
  // ... chỉ export những components cần thiết
} from './components'

// Lazy load heavy components
export const HeavyAnalysisComponents = {
  ChartVisualization: dynamic(() => import('./ChartVisualization')),
  AdvancedMetrics: dynamic(() => import('./AdvancedMetrics')),
}
```

## 14. Monitoring & Analytics

### Component Performance Tracking
```typescript
// Performance monitoring cho components
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        console.log(`${componentName} render time:`, endTime - startTime)
      }
    })
    
    return <Component {...props} />
  })
}

// Usage
export const TrackedWordAnalysisDisplay = withPerformanceTracking(
  WordAnalysisDisplay,
  'WordAnalysisDisplay'
)
```

### User Interaction Analytics
```typescript
// Track user interactions với analysis components
export function useAnalysisAnalytics() {
  const trackInteraction = (type: string, action: string, data?: any) => {
    // Send to analytics service
    analytics.track('analysis_interaction', {
      component: type,
      action,
      data,
      timestamp: new Date().toISOString()
    })
  }
  
  return { trackInteraction }
}

// Usage trong component
export function WordAnalysisDisplay({ analysis }: WordAnalysisDisplayProps) {
  const { trackInteraction } = useAnalysisAnalytics()
  
  const handleSynonymClick = (word: string) => {
    trackInteraction('word_analysis', 'synonym_click', { word })
    // ... rest of logic
  }
  
  // ... rest of component
}
```

## Kết luận

Kiến trúc UI components này được thiết kế để:

1. **Hiển thị rich fields** từ các interface TypeScript mới một cách hiệu quả
2. **Tái sử dụng components** để giảm code duplication
3. **Responsive design** cho mobile và desktop
4. **Accessibility** với ARIA labels và keyboard navigation
5. **Performance optimization** với lazy loading và virtualization
6. **Error handling** và loading states tốt
7. **Testing strategy** toàn diện
8. **Monitoring** và analytics capabilities

Với cấu trúc này, hệ thống có thể mở rộng dễ dàng khi thêm các tính năng phân tích mới trong tương lai.