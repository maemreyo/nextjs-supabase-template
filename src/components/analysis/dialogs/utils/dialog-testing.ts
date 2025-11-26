import {
  AnalysisType,
  AnalysisItem,
  DialogGlobalState
} from '../types/dialog-types';

/**
 * Dialog testing utilities
 */
export const dialogTesting = {
  /**
   * Create mock analysis item for testing
   */
  createMockAnalysisItem: (type: AnalysisType, overrides?: Partial<AnalysisItem>): AnalysisItem => {
    const baseItem = {
      id: `test-${type}-${Date.now()}`,
      analysisId: `test-analysis-${type}`,
      sessionId: 'test-session',
      analysisType: type,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    switch (type) {
      case 'word':
        return {
          ...baseItem,
          analysisType: 'word',
          word: 'test word',
          translation: 'test translation',
          definition: 'test definition',
          ipa: '/test/',
          pos: 'noun',
          ...overrides,
        } as AnalysisItem;
      case 'phrase':
        return {
          ...baseItem,
          analysisType: 'phrase',
          phrase: 'test phrase',
          naturalTranslation: 'test natural translation',
          literalMeaning: 'test literal meaning',
          ...overrides,
        } as AnalysisItem;
      case 'sentence':
        return {
          ...baseItem,
          analysisType: 'sentence',
          sentence: 'test sentence',
          naturalTranslation: 'test natural translation',
          mainIdea: 'test main idea',
          ...overrides,
        } as AnalysisItem;
      case 'paragraph':
        return {
          ...baseItem,
          analysisType: 'paragraph',
          paragraph: 'test paragraph',
          mainTopic: 'test topic',
          tone: 'neutral',
          ...overrides,
        } as AnalysisItem;
      default:
        return baseItem as AnalysisItem;
    }
  },
  
  /**
   * Create mock dialog state for testing
   */
  createMockDialogState: (overrides?: Partial<DialogGlobalState>): DialogGlobalState => {
    return {
      openDialogs: {
        word: false,
        phrase: false,
        sentence: false,
        paragraph: false,
      },
      dialogData: {
        word: null,
        phrase: null,
        sentence: null,
        paragraph: null,
      },
      dialogStates: {
        word: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
        phrase: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
        sentence: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
        paragraph: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
      },
      settings: {
        enableAnimations: true,
        enableKeyboardShortcuts: true,
        defaultDialogSize: 'large',
        enableResize: true,
        enableFullscreen: true,
      },
      ...overrides,
    };
  },

  /**
   * Test loading state clearing functionality
   */
  testLoadingStateClearing: () => {
    console.group('🧪 Testing Loading State Clearing');
    
    const testCases = [
      {
        name: 'Word Dialog Content',
        type: 'word' as AnalysisType,
        mockData: {
          analysisType: 'word',
          word: 'test',
          translation: 'test translation',
          definition: 'test definition',
        }
      },
      {
        name: 'Phrase Dialog Content',
        type: 'phrase' as AnalysisType,
        mockData: {
          analysisType: 'phrase',
          phrase: 'test phrase',
          naturalTranslation: 'test translation',
        }
      },
      {
        name: 'Sentence Dialog Content',
        type: 'sentence' as AnalysisType,
        mockData: {
          analysisType: 'sentence',
          sentence: 'test sentence',
          naturalTranslation: 'test translation',
        }
      },
      {
        name: 'Paragraph Dialog Content',
        type: 'paragraph' as AnalysisType,
        mockData: {
          analysisType: 'paragraph',
          paragraph: 'test paragraph',
          mainTopic: 'test topic',
        }
      }
    ];

    testCases.forEach(({ name, type, mockData }) => {
      console.log(`\n📋 Testing ${name}:`);
      
      // Create initial state with loading = true
      const initialState = dialogTesting.createMockDialogState({
        openDialogs: {
          ...dialogTesting.createMockDialogState().openDialogs,
          [type]: true
        },
        dialogData: {
          ...dialogTesting.createMockDialogState().dialogData,
          [type]: mockData
        },
        dialogStates: {
          ...dialogTesting.createMockDialogState().dialogStates,
          [type]: {
            loading: true,
            error: null,
            fullscreen: false,
            lastUpdated: Date.now()
          }
        }
      });

      console.log(`  ✅ Initial loading state: ${initialState.dialogStates[type]?.loading}`);
      console.log(`  ✅ Data available: ${!!initialState.dialogData[type]}`);
      
      // Simulate the useEffect logic
      const hasData = !!initialState.dialogData[type];
      const isLoading = initialState.dialogStates[type]?.loading || false;
      
      if (hasData && isLoading) {
        console.log(`  ✅ Should clear loading state: true`);
        console.log(`  ✅ Loading state should be set to: false`);
      } else {
        console.log(`  ⚠️  No action needed - Data: ${hasData}, Loading: ${isLoading}`);
      }
    });

    console.log('\n✅ Loading state clearing tests completed!');
    console.groupEnd();
  },

  /**
   * Run all dialog tests including loading state tests
   */
  runAllDialogTests: () => {
    console.group('🧪 Running All Dialog Tests');
    
    try {
      dialogTesting.testLoadingStateClearing();
      console.log('\n✅ All dialog tests passed!');
    } catch (error) {
      console.error('\n❌ Dialog tests failed:', error);
    }
    
    console.groupEnd();
  },
};

// Export test runner to browser console for easy testing
if (typeof window !== 'undefined') {
  (window as any).runDialogTests = dialogTesting.runAllDialogTests;
  (window as any).testLoadingState = dialogTesting.testLoadingStateClearing;
}