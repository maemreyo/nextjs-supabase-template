# Dialog Components Specification Cho Analysis Types

## 1. Word Analysis Dialog

### 1.1. WordAnalysisDialog Component
```typescript
interface WordAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: WordAnalysis | null;
  onPronounce?: (word: string) => void;
  onAddToVocabulary?: (word: WordAnalysis) => void;
  onExport?: (analysis: WordAnalysis, format: ExportFormat) => void;
  className?: string;
}
```

### 1.2. WordAnalysisContent Component
```typescript
interface WordAnalysisContentProps {
  analysis: WordAnalysis;
  onPronounce?: (word: string) => void;
  showPhonetic?: boolean;
  compact?: boolean;
}
```

**Features:**
- Hiển thị từ, IPA, định nghĩa, bản dịch
- POS tags, CEFR level, difficulty
- Example sentences và translations
- Root meaning, inference clues
- Context notes và usage tips
- Pronunciation button với audio feedback
- Synonyms, antonyms, variations

### 1.3. WordAnalysisActions Component
```typescript
interface WordAnalysisActionsProps {
  analysis: WordAnalysis;
  onAddToVocabulary?: (word: WordAnalysis) => void;
  onExport?: (analysis: WordAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: WordAnalysis) => void;
  onPrint?: (analysis: WordAnalysis) => void;
}
```

**Actions:**
- Add to Vocabulary (với form validation)
- Export (PDF, JSON, CSV)
- Share (clipboard, native share)
- Print (optimized layout)
- Copy to clipboard
- Pronounce (text-to-speech)

## 2. Phrase Analysis Dialog

### 2.1. PhraseAnalysisDialog Component
```typescript
interface PhraseAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: PhraseAnalysis | null;
  onAnalyzeWords?: (words: string[]) => void;
  onExport?: (analysis: PhraseAnalysis, format: ExportFormat) => void;
  className?: string;
}
```

### 2.2. PhraseAnalysisContent Component
```typescript
interface PhraseAnalysisContentProps {
  analysis: PhraseAnalysis;
  onAnalyzeWords?: (words: string[]) => void;
  showComponents?: boolean;
  compact?: boolean;
}
```

**Features:**
- Hiển thị phrase, natural translation, literal meaning
- Contextual meaning, Vietnamese translation
- Phrase type, grammatical pattern
- Register level, complexity level
- Cultural notes, stylistic notes
- Memory aids, usage tips
- Component breakdown (words, roles, meanings)
- Usage examples và tips

### 2.3. PhraseAnalysisActions Component
```typescript
interface PhraseAnalysisActionsProps {
  analysis: PhraseAnalysis;
  onAnalyzeWords?: (words: string[]) => void;
  onExport?: (analysis: PhraseAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: PhraseAnalysis) => void;
  onPrint?: (analysis: PhraseAnalysis) => void;
}
```

**Actions:**
- Analyze individual words
- Export phrase analysis
- Share phrase results
- Print optimized layout
- Copy phrase to clipboard
- Add components to vocabulary

## 3. Sentence Analysis Dialog

### 3.1. SentenceAnalysisDialog Component
```typescript
interface SentenceAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: SentenceAnalysis | null;
  onBreakdown?: (sentence: string) => void;
  onExport?: (analysis: SentenceAnalysis, format: ExportFormat) => void;
  className?: string;
}
```

### 3.2. SentenceAnalysisContent Component
```typescript
interface SentenceAnalysisContentProps {
  analysis: SentenceAnalysis;
  onBreakdown?: (sentence: string) => void;
  showClauses?: boolean;
  compact?: boolean;
}
```

**Features:**
- Hiển thị sentence, natural translation
- Main idea, subject, verb, object
- Function, sentence type, complexity
- Sentiment, subtext
- Grammar breakdown (clauses, structure)
- Relation to previous sentences
- Context paragraph

### 3.3. SentenceAnalysisActions Component
```typescript
interface SentenceAnalysisActionsProps {
  analysis: SentenceAnalysis;
  onBreakdown?: (sentence: string) => void;
  onExport?: (analysis: SentenceAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: SentenceAnalysis) => void;
  onPrint?: (analysis: SentenceAnalysis) => void;
}
```

**Actions:**
- Grammar breakdown
- Export sentence analysis
- Share sentence results
- Print with formatting
- Copy sentence to clipboard
- Analyze individual clauses

## 4. Paragraph Analysis Dialog

### 4.1. ParagraphAnalysisDialog Component
```typescript
interface ParagraphAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ParagraphAnalysis | null;
  onSummarize?: (paragraph: string) => void;
  onExport?: (analysis: ParagraphAnalysis, format: ExportFormat) => void;
  className?: string;
}
```

### 4.2. ParagraphAnalysisContent Component
```typescript
interface ParagraphAnalysisContentProps {
  analysis: ParagraphAnalysis;
  onSummarize?: (paragraph: string) => void;
  showKeywords?: boolean;
  compact?: boolean;
}
```

**Features:**
- Hiển thị paragraph, main topic
- Tone, target audience, type
- Vocabulary level, sentiment analysis
- Flow score, logic score
- Sentence variety analysis
- Better version suggestions
- Gap analysis
- Keywords và transition words

### 4.3. ParagraphAnalysisActions Component
```typescript
interface ParagraphAnalysisActionsProps {
  analysis: ParagraphAnalysis;
  onSummarize?: (paragraph: string) => void;
  onExport?: (analysis: ParagraphAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: ParagraphAnalysis) => void;
  onPrint?: (analysis: ParagraphAnalysis) => void;
}
```

**Actions:**
- Generate summary
- Export paragraph analysis
- Share paragraph results
- Print with layout optimization
- Copy paragraph to clipboard
- Improve paragraph suggestions

## 5. Common Base Components

### 5.1. BaseDialog Component
```typescript
interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'fullscreen';
  showCloseButton?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
}
```

**Features:**
- Responsive sizing
- Resizable handle
- Fullscreen toggle
- Keyboard shortcuts
- Animation transitions
- Accessibility attributes
- Mobile optimization

### 5.2. DialogHeader Component
```typescript
interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
```

### 5.3. DialogFooter Component
```typescript
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'center' | 'right';
}
```

### 5.4. DialogActions Component
```typescript
interface DialogActionsProps {
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'outline' | 'destructive' | 'ghost';
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  }>;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}
```

## 6. State Management Hooks

### 6.1. useDialogState Hook
```typescript
interface DialogState {
  openDialogs: Record<AnalysisType, boolean>;
  dialogData: Record<AnalysisType, AnalysisItem | null>;
  dialogStates: Record<AnalysisType, {
    loading: boolean;
    error: string | null;
    fullscreen: boolean;
    resizedWidth?: number;
  }>;
}

interface UseDialogStateReturn {
  state: DialogState;
  actions: {
    openDialog: (type: AnalysisType, data: AnalysisItem) => void;
    closeDialog: (type: AnalysisType) => void;
    updateDialogData: (type: AnalysisType, data: AnalysisItem) => void;
    setDialogLoading: (type: AnalysisType, loading: boolean) => void;
    setDialogError: (type: AnalysisType, error: string | null) => void;
    toggleFullscreen: (type: AnalysisType) => void;
    setDialogWidth: (type: AnalysisType, width: number) => void;
  };
}
```

### 6.2. useDialogActions Hook
```typescript
interface UseDialogActionsProps {
  analysis: AnalysisItem;
  analysisType: AnalysisType;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  onShare?: (analysis: AnalysisItem) => void;
  onPrint?: (analysis: AnalysisItem) => void;
}

interface UseDialogActionsReturn {
  actions: {
    handleExport: (format: ExportFormat) => Promise<void>;
    handleShare: () => Promise<void>;
    handlePrint: () => void;
    handleCopy: () => void;
    handlePronounce: (text: string) => void;
  };
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}
```

### 6.3. useDialogKeyboard Hook
```typescript
interface UseDialogKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onFullscreen?: () => void;
  onExport?: (format: ExportFormat) => void;
  onPrint?: () => void;
  onShare?: () => void;
}

interface KeyboardShortcuts {
  escape: () => void;
  ctrlF: () => void;
  ctrlP: () => void;
  ctrlE: () => void;
  ctrlS: () => void;
  ctrlShiftC: () => void;
}
```

## 7. Export Functionality

### 7.1. Export Formats
```typescript
type ExportFormat = 'pdf' | 'json' | 'csv' | 'txt' | 'html';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeOriginalText: boolean;
  customTemplate?: string;
  filename?: string;
}
```

### 7.2. Export Utilities
```typescript
interface ExportUtils {
  exportToPDF: (analysis: AnalysisItem, options: ExportOptions) => Promise<void>;
  exportToJSON: (analysis: AnalysisItem, options: ExportOptions) => Promise<void>;
  exportToCSV: (analysis: AnalysisItem, options: ExportOptions) => Promise<void>;
  exportToTXT: (analysis: AnalysisItem, options: ExportOptions) => Promise<void>;
  exportToHTML: (analysis: AnalysisItem, options: ExportOptions) => Promise<void>;
  generateFilename: (analysis: AnalysisItem, format: ExportFormat) => string;
}
```

## 8. Integration Specifications

### 8.1. AnalysisItemCard Integration
```typescript
interface EnhancedAnalysisItemCardProps extends AnalysisItemProps {
  // Dialog system integration
  dialogSystem?: 'legacy' | 'new';
  onViewDetails?: (analysis: AnalysisItem) => void;
  onEdit?: (analysis: AnalysisItem) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  
  // Dialog configuration
  dialogSize?: 'default' | 'large' | 'xlarge';
  enableFullscreen?: boolean;
  enableResize?: boolean;
}
```

### 8.2. Dialog Manager Service
```typescript
interface DialogManagerService {
  openDialog: (type: AnalysisType, data: AnalysisItem) => void;
  closeDialog: (type: AnalysisType) => void;
  closeAllDialogs: () => void;
  getDialogState: (type: AnalysisType) => DialogState['dialogStates'][AnalysisType];
  subscribeToDialogChanges: (callback: (state: DialogState) => void) => () => void;
  unsubscribeFromDialogChanges: (callback: (state: DialogState) => void) => void;
}
```

### 8.3. Event System
```typescript
interface DialogEvents {
  'dialog:open': { type: AnalysisType; data: AnalysisItem };
  'dialog:close': { type: AnalysisType };
  'dialog:data-update': { type: AnalysisType; data: AnalysisItem };
  'dialog:loading': { type: AnalysisType; loading: boolean };
  'dialog:error': { type: AnalysisType; error: string | null };
}
```

## 9. Performance Considerations

### 9.1. Optimization Strategies
- **Lazy loading**: Chỉ load content khi cần thiết
- **Memoization**: Cache computed values và components
- **Virtualization**: Cho large lists trong dialog
- **Code splitting**: Dynamic imports cho dialog types
- **State optimization**: Minimize re-renders

### 9.2. Memory Management
- **Cleanup**: Proper cleanup trong useEffect
- **Event listeners**: Remove listeners khi unmount
- **Image optimization**: Optimize images trong content
- **Bundle size**: Tree-shaking cho unused dialog types

### 9.3. Accessibility
- **Keyboard navigation**: Full keyboard support
- **Screen reader**: Proper ARIA labels
- **Focus management**: Trap focus trong dialog
- **High contrast**: Support high contrast mode
- **Reduced motion**: Respect prefers-reduced-motion

## 10. Testing Strategy

### 10.1. Unit Testing
```typescript
// Test structure cho mỗi dialog type
describe('WordAnalysisDialog', () => {
  it('should render word analysis correctly', () => {
    // Test rendering với word data
  });
  
  it('should handle pronunciation action', () => {
    // Test pronunciation functionality
  });
  
  it('should export in different formats', () => {
    // Test export functionality
  });
});
```

### 10.2. Integration Testing
```typescript
// Test integration với AnalysisItemCard
describe('AnalysisItemCard Integration', () => {
  it('should open correct dialog type', () => {
    // Test dialog type selection
  });
  
  it('should pass correct props to dialog', () => {
    // Test prop passing
  });
});
```

### 10.3. E2E Testing
```typescript
// Test user flows
describe('Dialog User Flows', () => {
  it('should complete word analysis flow', () => {
    // Test complete user journey
  });
  
  it('should handle keyboard navigation', () => {
    // Test accessibility
  });
});
```

## 11. Migration Strategy

### 11.1. Phase 1: Foundation (Week 1)
1. Create base dialog infrastructure
2. Implement common components
3. Setup state management
4. Create testing framework

### 11.2. Phase 2: Core Dialogs (Week 2-3)
1. Implement WordAnalysisDialog
2. Implement PhraseAnalysisDialog
3. Implement SentenceAnalysisDialog
4. Implement ParagraphAnalysisDialog

### 11.3. Phase 3: Integration (Week 4)
1. Update AnalysisItemCard
2. Implement dialog manager
3. Add keyboard shortcuts
4. Performance optimization

### 11.4. Phase 4: Polish (Week 5)
1. Accessibility improvements
2. Mobile optimization
3. Documentation
4. Final testing

### 11.5. Rollout Strategy
1. **Feature flags**: Enable new system gradually
2. **A/B testing**: Compare old vs new system
3. **User feedback**: Collect feedback iteratively
4. **Performance monitoring**: Track metrics
5. **Fallback mechanism**: Revert to legacy if needed