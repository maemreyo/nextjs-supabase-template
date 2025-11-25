import { AnalysisItem, AnalysisType, WordAnalysis, PhraseAnalysis, SentenceAnalysis, ParagraphAnalysis } from '../types/analysis-types';

/**
 * Transform API data to standardized AnalysisItem format
 * This handles the conversion from the API response format to our internal types
 */
export function transformAnalysisData(apiData: any): AnalysisItem[] {
  if (!apiData || !Array.isArray(apiData)) {
    return [];
  }
  
  return apiData.map(item => {
    // Base properties common to all analysis types
    const baseItem = {
      id: item.id,
      analysisId: item.analysis_id || item.id,
      sessionId: item.session_id,
      position: item.position,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
    
    // Transform based on analysis type
    switch (item.analysis_type) {
      case 'word':
        return transformWordAnalysis(item, baseItem);
      case 'phrase':
        return transformPhraseAnalysis(item, baseItem);
      case 'sentence':
        return transformSentenceAnalysis(item, baseItem);
      case 'paragraph':
        return transformParagraphAnalysis(item, baseItem);
      default:
        return null;
    }
  }).filter(Boolean) as AnalysisItem[];
}

/**
 * Transform word analysis data
 */
function transformWordAnalysis(apiItem: any, baseItem: any): WordAnalysis {
  const wordData = apiItem.word_analysis || apiItem;
  
  return {
    ...baseItem,
    analysisType: 'word' as const,
    word: wordData.word || '',
    translation: wordData.vietnamese_translation || wordData.translation,
    definition: wordData.context_meaning || wordData.definition,
    ipa: wordData.ipa,
    pos: wordData.pos,
    cefr: wordData.cefr,
    contextMeaning: wordData.context_meaning,
    exampleSentence: wordData.example_sentence,
    exampleTranslation: wordData.example_translation,
    tone: wordData.tone,
    rootMeaning: wordData.root_meaning,
    inferenceClues: wordData.inference_clues,
    inferenceReasoning: wordData.inference_reasoning,
    paragraphContext: wordData.paragraph_context,
    sentenceContext: wordData.sentence_context,
  };
}

/**
 * Transform phrase analysis data
 */
function transformPhraseAnalysis(apiItem: any, baseItem: any): PhraseAnalysis {
  const phraseData = apiItem.phrase_analysis || apiItem;
  
  return {
    ...baseItem,
    analysisType: 'phrase' as const,
    phrase: phraseData.phrase || '',
    naturalTranslation: phraseData.natural_translation,
    literalMeaning: phraseData.literal_meaning,
    contextualMeaning: phraseData.contextual_meaning,
    vietnameseTranslation: phraseData.vietnamese_translation,
    partOfSpeech: phraseData.part_of_speech,
    phraseType: phraseData.phrase_type,
    grammaticalPattern: phraseData.grammatical_pattern,
    registerLevel: phraseData.register_level,
    complexityLevel: phraseData.complexity_level,
    frequencyLevel: phraseData.frequency_level,
    culturalNotes: phraseData.cultural_notes,
    stylisticNotes: phraseData.stylistic_notes,
    memoryAid: phraseData.memory_aid,
    usageExamples: phraseData.usage_examples,
    usageTips: phraseData.usage_tips,
    synonyms: phraseData.synonyms,
    antonyms: phraseData.antonyms,
    variations: phraseData.variations,
    sentenceContext: phraseData.sentence_context,
    paragraphContext: phraseData.paragraph_context,
  };
}

/**
 * Transform sentence analysis data
 */
function transformSentenceAnalysis(apiItem: any, baseItem: any): SentenceAnalysis {
  const sentenceData = apiItem.sentence_analysis || apiItem;
  
  return {
    ...baseItem,
    analysisType: 'sentence' as const,
    sentence: sentenceData.sentence || '',
    naturalTranslation: sentenceData.natural_translation,
    literalTranslation: sentenceData.literal_translation,
    mainIdea: sentenceData.main_idea,
    subject: sentenceData.subject,
    mainVerb: sentenceData.main_verb,
    object: sentenceData.object,
    function: sentenceData.function,
    sentenceType: sentenceData.sentence_type,
    complexityLevel: sentenceData.complexity_level,
    sentiment: sentenceData.sentiment,
    subtext: sentenceData.subtext,
    clauses: sentenceData.clauses,
    paragraphContext: sentenceData.paragraph_context,
    relationToPrevious: sentenceData.relation_to_previous,
  };
}

/**
 * Transform paragraph analysis data
 */
function transformParagraphAnalysis(apiItem: any, baseItem: any): ParagraphAnalysis {
  const paragraphData = apiItem.paragraph_analysis || apiItem;
  
  return {
    ...baseItem,
    analysisType: 'paragraph' as const,
    paragraph: paragraphData.paragraph || '',
    mainTopic: paragraphData.main_topic,
    tone: paragraphData.tone,
    targetAudience: paragraphData.target_audience,
    type: paragraphData.type,
    vocabularyLevel: paragraphData.vocabulary_level,
    sentimentLabel: paragraphData.sentiment_label,
    sentimentIntensity: paragraphData.sentiment_intensity,
    sentimentJustification: paragraphData.sentiment_justification,
    flowScore: paragraphData.flow_score,
    logicScore: paragraphData.logic_score,
    sentenceVariety: paragraphData.sentence_variety,
    betterVersion: paragraphData.better_version,
    gapAnalysis: paragraphData.gap_analysis,
    keywords: paragraphData.keywords,
    transitionWords: paragraphData.transition_words,
  };
}

/**
 * Group analyses by type
 */
export function groupAnalysesByType(analyses: AnalysisItem[]): Record<AnalysisType, AnalysisItem[]> {
  const grouped = {
    word: [],
    phrase: [],
    sentence: [],
    paragraph: [],
  } as Record<AnalysisType, AnalysisItem[]>;
  
  analyses.forEach(analysis => {
    if (grouped[analysis.analysisType]) {
      grouped[analysis.analysisType].push(analysis);
    }
  });
  
  return grouped;
}

/**
 * Sort analyses by position or creation date
 */
export function sortAnalyses(analyses: AnalysisItem[]): AnalysisItem[] {
  return [...analyses].sort((a, b) => {
    // First try to sort by position
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }
    
    // Fallback to creation date
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    
    return dateA - dateB;
  });
}

/**
 * Filter analyses by type
 */
export function filterAnalysesByType(analyses: AnalysisItem[], types: AnalysisType[]): AnalysisItem[] {
  return analyses.filter(analysis => types.includes(analysis.analysisType));
}

/**
 * Get analysis type display name
 */
export function getAnalysisTypeDisplayName(type: AnalysisType): string {
  const names = {
    word: 'Từ vựng',
    phrase: 'Cụm từ',
    sentence: 'Câu',
    paragraph: 'Đoạn văn',
  };
  
  return names[type] || type;
}

/**
 * Get analysis type icon
 */
export function getAnalysisTypeIcon(type: AnalysisType): string {
  const icons = {
    word: '📝',
    phrase: '💬',
    sentence: '📄',
    paragraph: '📋',
  };
  
  return icons[type] || '📄';
}