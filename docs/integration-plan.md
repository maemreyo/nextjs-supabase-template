# Integration Plan Cho Dialog System Với AnalysisItemCard

## 1. Integration Strategy Overview

### 1.1. Mục Tiêu
- Tích hợp dialog system mới vào AnalysisItemCard hiện có
- Giữ lại backward compatibility với existing system
- Cung cấp migration path để chuyển đổi dần
- Tối ưu hóa performance và user experience

### 1.2. Integration Phases
1. **Phase 1**: Foundation setup (Week 1)
2. **Phase 2**: Core dialog implementation (Week 2-3)
3. **Phase 3**: Integration với AnalysisItemCard (Week 4)
4. **Phase 4**: Testing và optimization (Week 5)

## 2. AnalysisItemCard Enhancement

### 2.1. Props Extension
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
  
  // Enhanced event handlers
  onDialogAction?: (action: DialogAction, analysis: AnalysisItem) => void;
}
```

### 2.2. Event Handler Updates
```typescript
// Enhanced event handlers trong AnalysisItemCard
const handleViewDetails = useCallback((analysis: AnalysisItem) => {
  if (dialogSystem === 'new') {
    dialogManager.openDialog(analysis.analysisType, analysis);
  } else {
    // Fallback to existing system
    onClick?.(analysis);
  }
}, [dialogSystem, onClick]);

const handleEdit = useCallback((analysis: AnalysisItem) => {
  if (dialogSystem === 'new') {
    // Open edit dialog với pre-filled data
    dialogManager.openDialog(analysis.analysisType, analysis, { mode: 'edit' });
  } else {
    // Fallback to existing system
    onAnalyze?.(analysis);
  }
}, [dialogSystem, onAnalyze]);

const handleExport = useCallback((analysis: AnalysisItem, format: ExportFormat) => {
  if (dialogSystem === 'new') {
    dialogManager.openDialog(analysis.analysisType, analysis, { mode: 'export', format });
  } else {
    // Fallback to existing system
    // Trigger existing export functionality
  }
}, [dialogSystem, onAnalyze]);
```

### 2.3. Component Structure Updates
```typescript
// Enhanced dropdown menu trong AnalysisItemCard
const DialogMenuItems = {
  view: {
    label: 'Xem chi tiết',
    icon: <Eye className="h-4 w-4" />,
    onClick: handleViewDetails,
    showCondition: (dialogSystem: 'new') || (analysis: AnalysisItem) => true,
  },
  edit: {
    label: 'Chỉnh sửa',
    icon: <Edit className="h-4 w-4" />,
    onClick: handleEdit,
    showCondition: (dialogSystem: 'new') || (analysis: AnalysisItem) => true,
  },
  export: {
    label: 'Xuất',
    icon: <Download className="h-4 w-4" />,
    onClick: handleExport,
    showCondition: (dialogSystem: 'new') || (analysis: AnalysisItem) => true,
  },
  // Keep existing items
  analyze: {
    label: 'Phân tích chi tiết',
    icon: <BookOpen className="h-4 w-4" />,
    onClick: onAnalyze,
  },
  remove: {
    label: 'Xóa khỏi danh sách',
    icon: <ExternalLink className="h-4 w-4" />,
    onClick: onRemove,
  },
};
```

## 3. Dialog Manager Service

### 3.1. Service Interface
```typescript
interface DialogManagerService {
  // Dialog control methods
  openDialog: (type: AnalysisType, data: AnalysisItem, options?: DialogOptions) => void;
  closeDialog: (type: AnalysisType) => void;
  closeAllDialogs: () => void;
  toggleDialog: (type: AnalysisType, data?: AnalysisItem) => void;
  
  // State access methods
  getDialogState: (type: AnalysisType) => DialogState;
  getAllDialogStates: () => Record<AnalysisType, DialogState>;
  getOpenDialogs: () => AnalysisType[];
  
  // Data management methods
  updateDialogData: (type: AnalysisType, data: AnalysisItem) => void;
  clearDialogData: (type: AnalysisType) => void;
  
  // Settings management
  updateSettings: (settings: Partial<DialogSettings>) => void;
  getSettings: () => DialogSettings;
  
  // Subscription methods
  subscribe: (callback: (state: DialogGlobalState) => void) => () => void;
  unsubscribe: (callback: (state: DialogGlobalState) => void) => void;
  
  // Migration methods
  migrateFromLegacy: () => Promise<boolean>;
  exportToLegacy: () => Promise<boolean>;
  importFromLegacy: () => Promise<LegacyDialogState>;
}
```

### 3.2. Service Implementation
```typescript
class DialogManagerServiceImpl implements DialogManagerService {
  private store: ReturnType<typeof useDialogStore>;
  private eventBus: DialogEventBus;
  
  constructor() {
    this.store = useDialogStore.getState();
    this.eventBus = dialogEventBus;
  }
  
  openDialog(type: AnalysisType, data: AnalysisItem, options?: DialogOptions) {
    // Update store
    this.store.openDialog(type, data);
    
    // Emit event
    this.eventBus.emit('dialog:open', { type, data });
    
    // Track analytics
    this.trackDialogAction('open', type, options);
  }
  
  closeDialog(type: AnalysisType) {
    this.store.closeDialog(type);
    this.eventBus.emit('dialog:close', { type });
    this.trackDialogAction('close', type);
  }
  
  // ... other methods
}
```

## 4. Migration Strategy

### 4.1. State Migration
```typescript
// Migration utilities
export const dialogMigration = {
  // Migrate from legacy AnalysisResultDialog state
  migrateFromLegacy: () => {
    const legacyState = localStorage.getItem('analysis-dialog-state');
    
    if (legacyState) {
      try {
        const parsed = JSON.parse(legacyState);
        
        // Convert to new structure
        const migratedState: Partial<DialogGlobalState> = {
          dialogData: {
            word: parsed.wordAnalysis || null,
            phrase: parsed.phraseAnalysis || null,
            sentence: parsed.sentenceAnalysis || null,
            paragraph: parsed.paragraphAnalysis || null,
          },
          settings: {
            enableAnimations: parsed.enableAnimations ?? true,
            enableKeyboardShortcuts: parsed.enableKeyboardShortcuts ?? true,
            defaultDialogSize: parsed.defaultSize || 'large',
            enableResize: parsed.enableResize ?? true,
            enableFullscreen: parsed.enableFullscreen ?? true,
          },
        };
        
        // Store in new system
        useDialogStore.setState(migratedState);
        
        // Clean up legacy
        localStorage.removeItem('analysis-dialog-state');
        
        return true;
      } catch (error) {
        console.error('Migration failed:', error);
        return false;
      }
    }
    
    return false;
  },
  
  // Export current state for rollback
  exportToLegacy: () => {
    const currentState = useDialogStore.getState();
    
    const legacyState = {
      wordAnalysis: currentState.dialogData.word,
      phraseAnalysis: currentState.dialogData.phrase,
      sentenceAnalysis: currentState.dialogData.sentence,
      paragraphAnalysis: currentState.dialogData.paragraph,
      enableAnimations: currentState.settings.enableAnimations,
      enableKeyboardShortcuts: currentState.settings.enableKeyboardShortcuts,
      defaultSize: currentState.settings.defaultDialogSize,
      enableResize: currentState.settings.enableResize,
      enableFullscreen: currentState.settings.enableFullscreen,
    };
    
    localStorage.setItem('analysis-dialog-state', JSON.stringify(legacyState));
    return true;
  },
};
```

### 4.2. Feature Flag Management
```typescript
// Feature flag utilities
export const dialogFeatureFlags = {
  // Check if new dialog system is enabled
  isNewSystemEnabled: () => {
    return process.env.NODE_ENV === 'development' || 
           localStorage.getItem('enable-new-dialog-system') === 'true';
  },
  
  // Enable/disable new system
  setNewSystemEnabled: (enabled: boolean) => {
    localStorage.setItem('enable-new-dialog-system', enabled.toString());
    
    // Force re-render
    window.dispatchEvent(new CustomEvent('dialog-system-changed'));
  },
  
  // Get current system
  getCurrentSystem: () => {
    return dialogFeatureFlags.isNewSystemEnabled() ? 'new' : 'legacy';
  },
};
```

## 5. Event System Integration

### 5.1. Event Bus Setup
```typescript
// Event bus for dialog system communication
class DialogEventBus {
  private listeners = new Map<DialogEventType, Set<Function>>();
  
  // Subscribe to dialog events
  subscribe(eventType: DialogEventType, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }
  
  // Emit dialog events
  emit(eventType: DialogEventType, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in dialog event listener:`, error);
        }
      });
    }
  }
}

// Global event bus instance
export const dialogEventBus = new DialogEventBus();
```

### 5.2. Event Types
```typescript
type DialogEventType = 
  | 'dialog:open'
  | 'dialog:close'
  | 'dialog:data-update'
  | 'dialog:loading'
  | 'dialog:error'
  | 'dialog:system-changed';
```

## 6. Performance Optimization

### 6.1. Lazy Loading Strategy
```typescript
// Lazy loading cho dialog components
const LazyDialog = ({ type, analysisId, ...props }: DialogProps) => {
  const [data, setData] = useState<AnalysisItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (type && analysisId) {
      // Load data chỉ khi cần
      loadAnalysisData(type, analysisId)
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [type, analysisId]);
  
  if (loading) {
    return <DialogSkeleton />;
  }
  
  return <ActualDialog data={data} {...props} />;
};
```

### 6.2. Memoization Strategy
```typescript
// Memoized dialog content
const MemoizedDialogContent = memo(({ analysis, type }: DialogContentProps) => {
  const content = useMemo(() => {
    // Generate content chỉ khi data thay đổi
    return generateDialogContent(analysis, type);
  }, [analysis, type]);
  
  return <div className="dialog-content">{content}</div>;
});
```

## 7. Testing Strategy

### 7.1. Integration Tests
```typescript
// Test integration với AnalysisItemCard
describe('AnalysisItemCard Integration', () => {
  beforeEach(() => {
    // Reset dialog state
    useDialogStore.setState({
      openDialogs: { word: false, phrase: false, sentence: false, paragraph: false },
      dialogData: { word: null, phrase: null, sentence: null, paragraph: null },
      dialogStates: {
        word: { loading: false, error: null },
        phrase: { loading: false, error: null },
        sentence: { loading: false, error: null },
        paragraph: { loading: false, error: null },
      },
    });
  });
  
  it('should open correct dialog type', () => {
    const { result } = renderHook(() => (
      <AnalysisItemCard
        analysis={mockWordAnalysis}
        dialogSystem="new"
        onViewDetails={mockHandlers.onViewDetails}
      />
    ));
    
    // Trigger view details
    fireEvent.click(result.getByText('Xem chi tiết'));
    
    // Check dialog state
    const state = useDialogStore.getState();
    expect(state.openDialogs.word).toBe(true);
    expect(state.dialogData.word).toEqual(mockWordAnalysis);
  });
});
```

### 7.2. Migration Tests
```typescript
// Test migration functionality
describe('Dialog Migration', () => {
  it('should migrate legacy state correctly', () => {
    // Setup legacy state
    localStorage.setItem('analysis-dialog-state', JSON.stringify({
      wordAnalysis: mockWordAnalysis,
      enableAnimations: true,
    }));
    
    // Run migration
    const result = dialogMigration.migrateFromLegacy();
    
    expect(result).toBe(true);
    
    // Check new state
    const newState = useDialogStore.getState();
    expect(newState.dialogData.word).toEqual(mockWordAnalysis);
    expect(newState.settings.enableAnimations).toBe(true);
  });
  
  it('should handle migration errors gracefully', () => {
    // Setup invalid legacy state
    localStorage.setItem('analysis-dialog-state', 'invalid-json');
    
    // Run migration
    const result = dialogMigration.migrateFromLegacy();
    
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Migration failed:');
  });
});
```

## 8. Rollout Strategy

### 8.1. Gradual Rollout
```typescript
// Feature flag based rollout
const DialogSystemProvider = ({ children }: { children: React.ReactNode }) => {
  const isNewSystem = dialogFeatureFlags.isNewSystemEnabled();
  
  if (isNewSystem) {
    return <NewDialogSystem>{children}</NewDialogSystem>;
  } else {
    return <LegacyDialogSystem>{children}</LegacyDialogSystem>;
  }
};
```

### 8.2. A/B Testing Framework
```typescript
// A/B testing cho dialog systems
const useDialogABTest = () => {
  const [testGroup, setTestGroup] = useState<'control' | 'variant'>('control');
  
  useEffect(() => {
    const group = localStorage.getItem('dialog-ab-test');
    if (group === 'variant') {
      setTestGroup('variant');
    }
  }, []);
  
  return {
    testGroup,
    isNewSystem: testGroup === 'variant',
  };
};
```

## 9. Monitoring and Analytics

### 9.1. Performance Metrics
```typescript
// Performance monitoring
export const dialogPerformance = {
  trackDialogOpen: (type: AnalysisType, duration: number) => {
    analytics.track('dialog_open_time', {
      dialog_type: type,
      duration_ms: duration,
      timestamp: Date.now(),
    });
  },
  
  trackDialogAction: (action: string, type: AnalysisType) => {
    analytics.track('dialog_action', {
      action,
      dialog_type: type,
      timestamp: Date.now(),
    });
  },
};
```

### 9.2. Error Tracking
```typescript
// Error tracking
export const dialogErrorTracking = {
  trackError: (error: DialogError, context: string) => {
    errorReporting.captureException(error, {
      context,
      tags: ['dialog', error.type],
    });
  },
  
  trackUserFeedback: (feedback: string, rating: number) => {
    analytics.track('dialog_feedback', {
      feedback,
      rating,
      timestamp: Date.now(),
    });
  },
};
```

## 10. Implementation Timeline

### 10.1. Week 1: Foundation
- [ ] Create base dialog infrastructure
- [ ] Implement common components
- [ ] Setup state management
- [ ] Create testing framework
- [ ] Documentation

### 10.2. Week 2-3: Core Dialogs
- [ ] Implement WordAnalysisDialog
- [ ] Implement PhraseAnalysisDialog
- [ ] Implement SentenceAnalysisDialog
- [ ] Implement ParagraphAnalysisDialog
- [ ] Create content components
- [ ] Create action components

### 10.3. Week 4: Integration
- [ ] Update AnalysisItemCard
- [ ] Implement dialog manager
- [ ] Add keyboard shortcuts
- [ ] Performance optimization

### 10.4. Week 5: Polish
- [ ] Accessibility improvements
- [ ] Mobile optimization
- [ ] Documentation
- [ ] Final testing
- [ ] Production rollout

## 11. Success Criteria

### 11.1. Technical Criteria
- [ ] All dialog types implemented với full functionality
- [ ] State management working correctly
- [ ] Integration với AnalysisItemCard complete
- [ ] Performance metrics meet targets
- [ ] Test coverage > 90%
- [ ] Documentation complete

### 11.2. User Experience Criteria
- [ ] Smooth transitions và animations
- [ ] Keyboard shortcuts working
- [ ] Mobile responsive design
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Error handling user-friendly
- [ ] Loading states informative

### 11.3. Business Criteria
- [ ] Backward compatibility maintained
- [ ] Migration path smooth
- [ ] Feature flags working
- [ ] Analytics tracking implemented
- [ ] Rollout strategy executed
- [ ] Team training completed

Integration plan này đảm bảo:
- **Smooth transition**: Không phá vỡ existing functionality
- **Flexibility**: Có thể toggle giữa systems
- **Performance**: Optimized cho production use
- **Maintainability**: Dễ maintain và extend
- **Testing**: Comprehensive test coverage
- **Monitoring**: Full analytics và error tracking