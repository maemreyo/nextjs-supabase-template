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

      
      // Simulate the useEffect logic
      const hasData = !!initialState.dialogData[type];
      const isLoading = initialState.dialogStates[type]?.loading || false;
      
      if (hasData && isLoading) {
      } else {
      }
    });

  },

  /**
   * Run all dialog tests including loading state tests
   */
  runAllDialogTests: () => {
    
    try {
      dialogTesting.testLoadingStateClearing();
    } catch (error) {
    }
    
  },
};

// Export test runner to browser console for easy testing
if (typeof window !== 'undefined') {
  (window as any).runDialogTests = dialogTesting.runAllDialogTests;
  (window as any).testLoadingState = dialogTesting.testLoadingStateClearing;
}