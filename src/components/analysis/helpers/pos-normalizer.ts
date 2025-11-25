// POS (Part of Speech) normalization utilities
// Maps various POS forms to standardized abbreviations

export interface POSMapping {
  [key: string]: {
    abbreviation: string;
    icon: string;
    label: string;
    color: string;
  };
}

// Standardized POS mapping with icons and colors
export const POS_MAP: POSMapping = {
  // Nouns
  'noun': { abbreviation: 'N', icon: '📝', label: 'Noun', color: 'bg-blue-100 text-blue-800' },
  'nouns': { abbreviation: 'N', icon: '📝', label: 'Noun', color: 'bg-blue-100 text-blue-800' },
  'common noun': { abbreviation: 'N', icon: '📝', label: 'Noun', color: 'bg-blue-100 text-blue-800' },
  'proper noun': { abbreviation: 'PN', icon: '📝', label: 'Proper Noun', color: 'bg-blue-100 text-blue-800' },
  'pronoun': { abbreviation: 'PRN', icon: '👤', label: 'Pronoun', color: 'bg-purple-100 text-purple-800' },
  
  // Verbs
  'verb': { abbreviation: 'V', icon: '⚡', label: 'Verb', color: 'bg-green-100 text-green-800' },
  'verbs': { abbreviation: 'V', icon: '⚡', label: 'Verb', color: 'bg-green-100 text-green-800' },
  'verb-past': { abbreviation: 'V-past', icon: '⚡', label: 'Past Verb', color: 'bg-green-100 text-green-800' },
  'verb-present': { abbreviation: 'V-pres', icon: '⚡', label: 'Present Verb', color: 'bg-green-100 text-green-800' },
  'verb-pt': { abbreviation: 'V-pt', icon: '⚡', label: 'Past Tense Verb', color: 'bg-green-100 text-green-800' },
  'verb-pp': { abbreviation: 'V-pp', icon: '⚡', label: 'Past Participle', color: 'bg-green-100 text-green-800' },
  'verb-ing': { abbreviation: 'V-ing', icon: '⚡', label: '-ing Verb', color: 'bg-green-100 text-green-800' },
  'auxiliary verb': { abbreviation: 'AUX', icon: '⚡', label: 'Auxiliary Verb', color: 'bg-green-100 text-green-800' },
  'modal verb': { abbreviation: 'MOD', icon: '⚡', label: 'Modal Verb', color: 'bg-green-100 text-green-800' },
  
  // Adjectives
  'adjective': { abbreviation: 'ADJ', icon: '🎨', label: 'Adjective', color: 'bg-yellow-100 text-yellow-800' },
  'adjectives': { abbreviation: 'ADJ', icon: '🎨', label: 'Adjective', color: 'bg-yellow-100 text-yellow-800' },
  'comparative': { abbreviation: 'ADJ-comp', icon: '🎨', label: 'Comparative', color: 'bg-yellow-100 text-yellow-800' },
  'superlative': { abbreviation: 'ADJ-sup', icon: '🎨', label: 'Superlative', color: 'bg-yellow-100 text-yellow-800' },
  
  // Adverbs
  'adverb': { abbreviation: 'ADV', icon: '🔍', label: 'Adverb', color: 'bg-orange-100 text-orange-800' },
  'adverbs': { abbreviation: 'ADV', icon: '🔍', label: 'Adverb', color: 'bg-orange-100 text-orange-800' },
  
  // Prepositions
  'preposition': { abbreviation: 'PREP', icon: '🔗', label: 'Preposition', color: 'bg-indigo-100 text-indigo-800' },
  'prepositions': { abbreviation: 'PREP', icon: '🔗', label: 'Preposition', color: 'bg-indigo-100 text-indigo-800' },
  
  // Conjunctions
  'conjunction': { abbreviation: 'CONJ', icon: '🔗', label: 'Conjunction', color: 'bg-indigo-100 text-indigo-800' },
  'coordinating conjunction': { abbreviation: 'CONJ-C', icon: '🔗', label: 'Coordinating Conjunction', color: 'bg-indigo-100 text-indigo-800' },
  'subordinating conjunction': { abbreviation: 'CONJ-S', icon: '🔗', label: 'Subordinating Conjunction', color: 'bg-indigo-100 text-indigo-800' },
  
  // Others
  'determiner': { abbreviation: 'DET', icon: '🔢', label: 'Determiner', color: 'bg-pink-100 text-pink-800' },
  'article': { abbreviation: 'ART', icon: '🔢', label: 'Article', color: 'bg-pink-100 text-pink-800' },
  'interjection': { abbreviation: 'INT', icon: '❗', label: 'Interjection', color: 'bg-red-100 text-red-800' },
  'exclamation': { abbreviation: 'EXCL', icon: '❗', label: 'Exclamation', color: 'bg-red-100 text-red-800' },
  'particle': { abbreviation: 'PART', icon: '✨', label: 'Particle', color: 'bg-gray-100 text-gray-800' },
  'numeral': { abbreviation: 'NUM', icon: '🔢', label: 'Numeral', color: 'bg-pink-100 text-pink-800' },
  'number': { abbreviation: 'NUM', icon: '🔢', label: 'Number', color: 'bg-pink-100 text-pink-800' },
  'phrase': { abbreviation: 'PHR', icon: '💬', label: 'Phrase', color: 'bg-teal-100 text-teal-800' },
  'clause': { abbreviation: 'CL', icon: '📋', label: 'Clause', color: 'bg-cyan-100 text-cyan-800' },
};

/**
 * Normalize POS string to standardized form
 */
export function normalizePOS(pos?: string | null): {
  abbreviation: string;
  icon: string;
  label: string;
  color: string;
} {
  if (!pos) {
    return POS_MAP['phrase'] || { abbreviation: 'UNK', icon: '❓', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
  
  // Convert to lowercase and trim for matching
  const normalizedPos = pos.toLowerCase().trim();
  
  // Direct match
  if (POS_MAP[normalizedPos]) {
    return POS_MAP[normalizedPos];
  }
  
  // Partial matches
  for (const [key, value] of Object.entries(POS_MAP)) {
    if (normalizedPos.includes(key) || key.includes(normalizedPos)) {
      return value;
    }
  }
  
  // Default fallback
  return POS_MAP['phrase'] || { abbreviation: 'UNK', icon: '❓', label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
}

/**
 * Get POS abbreviation only
 */
export function getPOSAbbreviation(pos?: string | null): string {
  return normalizePOS(pos).abbreviation;
}

/**
 * Get POS icon only
 */
export function getPOSIcon(pos?: string | null): string {
  return normalizePOS(pos).icon;
}

/**
 * Get POS color classes
 */
export function getPOSColor(pos?: string | null): string {
  return normalizePOS(pos).color;
}