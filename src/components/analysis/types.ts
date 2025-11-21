// Interface cho Collocation object
export interface Collocation {
  phrase: string;
  meaning: string;
  usage_example?: string;
  frequency_level: 'common' | 'uncommon' | 'rare';
}

// Interface cho WordAnalysis
export interface WordAnalysis {
  meta: {
    word: string;
    ipa: string;
    pos: string;
    cefr: string;
    tone: string;
  };
  definitions: {
    root_meaning: string;
    context_meaning: string;
    vietnamese_translation: string;
  };
  inference_strategy: {
    clues: string;
    reasoning: string;
  };
  relations: {
    synonyms: Array<{
      word: string;
      ipa: string;
      meaning_en: string;
      meaning_vi: string;
    }>;
    antonyms: Array<{
      word: string;
      ipa: string;
      meaning_en: string;
      meaning_vi: string;
    }>;
  };
  usage: {
    collocations: Collocation[];
    example_sentence: string;
    example_translation: string;
  };
}

// Props cho CollocationList component
export interface CollocationListProps {
  collocations: Collocation[];
  onCollocationClick?: (collocation: Collocation) => void;
  maxItems?: number;
  showFrequencyLevel?: boolean;
  className?: string;
}

// Props cho WordUsageSection component
export interface WordUsageSectionProps {
  usage: WordAnalysis['usage'];
  onCollocationClick?: (collocation: Collocation) => void;
  maxCollocations?: number;
  className?: string;
}

// Props cho WordAnalysisDisplay component
export interface WordAnalysisDisplayProps {
  analysis: WordAnalysis;
  isLoading?: boolean;
  error?: string;
  onSynonymClick?: (word: string) => void;
  onAntonymClick?: (word: string) => void;
  onCollocationClick?: (collocation: Collocation) => void;
  className?: string;
}

// Props cho SynonymAntonymList component
export interface SynonymAntonymListProps {
  synonyms: WordAnalysis['relations']['synonyms'];
  antonyms: WordAnalysis['relations']['antonyms'];
  onSynonymClick?: (word: string) => void;
  onAntonymClick?: (word: string) => void;
  maxItems?: number;
  className?: string;
}