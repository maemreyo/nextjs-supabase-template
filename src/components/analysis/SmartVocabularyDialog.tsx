import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, AlertCircle, Info } from 'lucide-react';

// Import types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import type { VocabularyWordInsert } from '@/types/vocabulary';
import type { MappedVocabularyData, ValidationResult } from './analysisUtils';

// Import utility functions
import {
  mapWordAnalysisToVocabulary,
  mapSentenceAnalysisToVocabulary,
  validateVocabularyData,
} from './analysisUtils';

// Define props interface
interface SmartVocabularyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResult: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
  onAddToVocabulary: (vocabularyData: VocabularyWordInsert) => Promise<void>;
}

export function SmartVocabularyDialog({
  open,
  onOpenChange,
  analysisResult,
  analysisType,
  onAddToVocabulary,
}: SmartVocabularyDialogProps) {
  // State management
  const [vocabularyData, setVocabularyData] = useState<VocabularyWordInsert>({
    word: '',
    ipa: null,
    part_of_speech: null,
    cefr_level: null,
    difficulty_level: 2,
    definition_en: '',
    definition_vi: '',
    vietnamese_translation: '',
    example_sentence: '',
    example_translation: '',
    context_notes: '',
    source_type: 'analysis',
    source_reference: '',
    status: 'active',
    mastery_level: 0,
    review_count: 0,
    correct_count: 0,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [mappedWords, setMappedWords] = useState<MappedVocabularyData[]>([]);

  // Auto-fill data when analysis result changes
  useEffect(() => {
    if (!analysisResult || !open) return;

    if (analysisType === 'word') {
      const wordAnalysis = analysisResult as WordAnalysis;
      const mappedData = mapWordAnalysisToVocabulary(wordAnalysis);
      setVocabularyData(mappedData);
      setMappedWords([mappedData]);
    } else if (analysisType === 'sentence') {
      const sentenceAnalysis = analysisResult as SentenceAnalysis;
      const mappedDataList = mapSentenceAnalysisToVocabulary(sentenceAnalysis);
      setMappedWords(mappedDataList);
      
      if (mappedDataList.length > 0) {
        setVocabularyData(mappedDataList[0] || vocabularyData);
        setSelectedWordIndex(0);
      }
    } else if (analysisType === 'paragraph') {
      // For paragraph analysis, we don't have direct mapping
      // Reset to default values
      setVocabularyData({
        word: '',
        ipa: null,
        part_of_speech: null,
        cefr_level: null,
        difficulty_level: 2,
        definition_en: '',
        definition_vi: '',
        vietnamese_translation: '',
        example_sentence: '',
        example_translation: '',
        context_notes: '',
        source_type: 'analysis',
        source_reference: `paragraph-analysis-${Date.now()}`,
        status: 'active',
        mastery_level: 0,
        review_count: 0,
        correct_count: 0,
      });
      setMappedWords([]);
    }
  }, [analysisResult, analysisType, open]);

  // Validate form data
  useEffect(() => {
    const validation = validateVocabularyData(vocabularyData);
    setValidationErrors(validation.errors);
  }, [vocabularyData]);

  // Handle field changes
  const handleFieldChange = (field: keyof VocabularyWordInsert, value: any) => {
    setVocabularyData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle word selection for sentence analysis
  const handleWordSelection = (index: number) => {
    setSelectedWordIndex(index);
    if (mappedWords[index]) {
      setVocabularyData(mappedWords[index]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validation = validateVocabularyData(vocabularyData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await onAddToVocabulary(vocabularyData);
      onOpenChange(false);
      
      // Reset form
      setVocabularyData({
        word: '',
        ipa: null,
        part_of_speech: null,
        cefr_level: null,
        difficulty_level: 2,
        definition_en: '',
        definition_vi: '',
        vietnamese_translation: '',
        example_sentence: '',
        example_translation: '',
        context_notes: '',
        source_type: 'analysis',
        source_reference: '',
        status: 'active',
        mastery_level: 0,
        review_count: 0,
        correct_count: 0,
      });
      setValidationErrors([]);
    } catch (error) {
      console.error('Failed to add to vocabulary:', error);
      setValidationErrors(['Failed to add to vocabulary. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = validationErrors.length === 0 && vocabularyData.word.trim() && (vocabularyData.definition_en?.trim() || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add to Vocabulary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Source: {analysisType === 'word' ? 'Word Analysis' : 
                      analysisType === 'sentence' ? 'Sentence Analysis' : 'Paragraph Analysis'}
              {analysisType === 'word' && analysisResult && (
                <span className="ml-2 font-mono text-sm">
                  "{(analysisResult as WordAnalysis).meta.word}"
                </span>
              )}
              {analysisType === 'sentence' && analysisResult && (
                <span className="ml-2 font-mono text-sm">
                  "{(analysisResult as SentenceAnalysis).meta.sentence}"
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Word Selection for Sentence Analysis */}
          {analysisType === 'sentence' && mappedWords.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Word to Add</Label>
              <div className="flex flex-wrap gap-2">
                {mappedWords.map((word, index) => (
                  <Button
                    key={index}
                    variant={selectedWordIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleWordSelection(index)}
                    className="text-xs"
                  >
                    {word.word}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Word */}
            <div className="space-y-2">
              <Label htmlFor="word">Word *</Label>
              <Input
                id="word"
                value={vocabularyData.word}
                onChange={(e) => handleFieldChange('word', e.target.value)}
                placeholder="Enter word..."
                className={validationErrors.some(e => e.includes('Word')) ? 'border-destructive' : ''}
              />
            </div>

            {/* IPA */}
            <div className="space-y-2">
              <Label htmlFor="ipa">IPA Pronunciation</Label>
              <Input
                id="ipa"
                value={vocabularyData.ipa || ''}
                onChange={(e) => handleFieldChange('ipa', e.target.value || null)}
                placeholder="Enter IPA..."
              />
            </div>

            {/* Part of Speech */}
            <div className="space-y-2">
              <Label htmlFor="part_of_speech">Part of Speech</Label>
              <Select
                value={vocabularyData.part_of_speech || ''}
                onValueChange={(value) => handleFieldChange('part_of_speech', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select part of speech" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="noun">Noun</SelectItem>
                  <SelectItem value="verb">Verb</SelectItem>
                  <SelectItem value="adjective">Adjective</SelectItem>
                  <SelectItem value="adverb">Adverb</SelectItem>
                  <SelectItem value="pronoun">Pronoun</SelectItem>
                  <SelectItem value="preposition">Preposition</SelectItem>
                  <SelectItem value="conjunction">Conjunction</SelectItem>
                  <SelectItem value="interjection">Interjection</SelectItem>
                  <SelectItem value="determiner">Determiner</SelectItem>
                  <SelectItem value="exclamation">Exclamation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CEFR Level */}
            <div className="space-y-2">
              <Label htmlFor="cefr_level">CEFR Level</Label>
              <Select
                value={vocabularyData.cefr_level || ''}
                onValueChange={(value) => handleFieldChange('cefr_level', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CEFR level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="A1">A1</SelectItem>
                  <SelectItem value="A2">A2</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select
                value={vocabularyData.difficulty_level?.toString() || '2'}
                onValueChange={(value) => handleFieldChange('difficulty_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Easy (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">Hard (3)</SelectItem>
                  <SelectItem value="4">Very Hard (4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vietnamese Translation */}
            <div className="space-y-2">
              <Label htmlFor="vietnamese_translation">Vietnamese Translation</Label>
              <Input
                id="vietnamese_translation"
                value={vocabularyData.vietnamese_translation || ''}
                onChange={(e) => handleFieldChange('vietnamese_translation', e.target.value || null)}
                placeholder="Enter Vietnamese translation..."
              />
            </div>
          </div>

          {/* Definition English */}
          <div className="space-y-2">
            <Label htmlFor="definition_en">Definition (English) *</Label>
            <Input
              id="definition_en"
              value={vocabularyData.definition_en || ''}
              onChange={(e) => handleFieldChange('definition_en', e.target.value || null)}
              placeholder="Enter English definition..."
              className={validationErrors.some(e => e.includes('Definition')) ? 'border-destructive' : ''}
            />
          </div>

          {/* Definition Vietnamese */}
          <div className="space-y-2">
            <Label htmlFor="definition_vi">Definition (Vietnamese)</Label>
            <Input
              id="definition_vi"
              value={vocabularyData.definition_vi || ''}
              onChange={(e) => handleFieldChange('definition_vi', e.target.value || null)}
              placeholder="Enter Vietnamese definition..."
            />
          </div>

          {/* Example Sentence */}
          <div className="space-y-2">
            <Label htmlFor="example_sentence">Example Sentence</Label>
            <Input
              id="example_sentence"
              value={vocabularyData.example_sentence || ''}
              onChange={(e) => handleFieldChange('example_sentence', e.target.value || null)}
              placeholder="Enter example sentence..."
            />
          </div>

          {/* Example Translation */}
          <div className="space-y-2">
            <Label htmlFor="example_translation">Example Translation</Label>
            <Input
              id="example_translation"
              value={vocabularyData.example_translation || ''}
              onChange={(e) => handleFieldChange('example_translation', e.target.value || null)}
              placeholder="Enter example translation..."
            />
          </div>

          {/* Context Notes */}
          <div className="space-y-2">
            <Label htmlFor="context_notes">Context Notes</Label>
            <Input
              id="context_notes"
              value={vocabularyData.context_notes || ''}
              onChange={(e) => handleFieldChange('context_notes', e.target.value || null)}
              placeholder="Enter context notes..."
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Add to Vocabulary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SmartVocabularyDialog;