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
};