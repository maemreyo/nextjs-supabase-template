import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, Share2, Maximize2, Minimize2, Printer,
  FileText, BookOpen, AlignLeft, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from "@/lib/utils";
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';
import { useAnalysisActions } from '@/hooks/useAnalysisActions';

interface AnalysisMetadata {
  processingTime?: number;
  tokensUsed?: number;
  model?: string;
  provider?: string;
}

interface AnalysisResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | PhraseAnalysis | null;
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph';
  originalText?: string;
  processingTime?: number;
  tokensUsed?: number;
  model?: string;
  provider?: string;
  meta?: AnalysisMetadata;
}

// Word/Phrase Analysis View Component
const WordPhraseAnalysisView = ({ data, type }: { data: WordAnalysis | PhraseAnalysis; type: 'word' | 'phrase' }) => {
  const isPhrase = type === 'phrase';
  const phraseData = isPhrase ? (data as PhraseAnalysis) : null;
  const wordData = !isPhrase ? (data as WordAnalysis) : null;

  return (
    <div className="space-y-6">
      {/* Meta Information */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
        <h2 className="text-3xl font-bold text-primary mb-4">{data.meta.phrase || data.meta.word}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetaBadge label="IPA" value={data.meta.ipa} />
          <MetaBadge label="Loại từ" value={data.meta.pos} />
          <MetaBadge label="Cấp độ" value={data.meta.cefr} variant="success" />
          <MetaBadge label="Giọng điệu" value={data.meta.tone} />
          {phraseData && <MetaBadge label="Kiểu" value={phraseData.meta.type} />}
          {phraseData && <MetaBadge label="Register" value={phraseData.meta.register} />}
        </div>
      </div>

      {/* Definitions */}
      <Section title="Định nghĩa" icon="📖">
        {phraseData ? (
          <div className="space-y-4">
            <DefinitionCard 
              title="Nghĩa đen" 
              content={phraseData.definitions.literal_meaning}
              variant="blue"
            />
            <DefinitionCard 
              title="Nghĩa bóng" 
              content={phraseData.definitions.figurative_meaning}
              variant="purple"
            />
            <DefinitionCard 
              title="Dịch tiếng Việt" 
              content={phraseData.definitions.vietnamese_translation}
              variant="green"
            />
            {phraseData.definitions.usage_notes && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Lưu ý sử dụng:</span> {phraseData.definitions.usage_notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <DefinitionCard 
              title="Nghĩa gốc" 
              content={wordData?.definitions.root_meaning}
              variant="blue"
            />
            <DefinitionCard 
              title="Nghĩa trong ngữ cảnh" 
              content={wordData?.definitions.context_meaning}
              variant="purple"
            />
            <DefinitionCard 
              title="Dịch tiếng Việt" 
              content={wordData?.definitions.vietnamese_translation}
              variant="green"
            />
          </div>
        )}
      </Section>

      {/* Components (Phrase only) */}
      {phraseData?.components && (
        <Section title="Thành phần cấu tạo" icon="🔤">
          <div className="grid gap-3">
            {phraseData.components.words.map((word, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg text-gray-900">{word.word}</span>
                      <span className="text-sm text-gray-500">{word.ipa}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{word.meaning}</p>
                    <p className="text-xs text-primary italic">{word.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Grammar & Structure (Phrase only) */}
      {phraseData?.grammar_and_structure && (
        <Section title="Ngữ pháp & Cấu trúc" icon="📐">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">Mẫu câu:</p>
            <p className="text-blue-800">{phraseData.grammar_and_structure.pattern}</p>
          </div>
          
          {phraseData.grammar_and_structure.variations && phraseData.grammar_and_structure.variations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Các biến thể:</h4>
              {phraseData.grammar_and_structure.variations.map((variation, idx) => (
                <div key={idx} className="bg-gray-50 border rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-2">{variation.phrase}</p>
                  <p className="text-sm text-gray-700 mb-2">{variation.meaning}</p>
                  <p className="text-sm text-gray-600 italic">"{variation.usage_example}"</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Inference Strategy (Word only) */}
      {wordData?.inference_strategy && (
        <Section title="Chiến lược suy luận" icon="🧠">
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">Manh mối:</p>
              <p className="text-sm text-blue-800">{wordData.inference_strategy.clues}</p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
              <p className="text-sm font-semibold text-purple-900 mb-2">Lý luận:</p>
              <p className="text-sm text-purple-800">{wordData.inference_strategy.reasoning}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Relations (Word only) */}
      {wordData?.relations && (
        <Section title="Quan hệ từ vựng" icon="🔗">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Synonyms */}
            {wordData.relations.synonyms && wordData.relations.synonyms.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Từ đồng nghĩa
                </h4>
                <div className="space-y-2">
                  {wordData.relations.synonyms.map((syn, idx) => (
                    <RelationCard key={idx} item={syn} variant="green" />
                  ))}
                </div>
              </div>
            )}

            {/* Antonyms */}
            {wordData.relations.antonyms && wordData.relations.antonyms.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Từ trái nghĩa
                </h4>
                <div className="space-y-2">
                  {wordData.relations.antonyms.map((ant, idx) => (
                    <RelationCard key={idx} item={ant} variant="red" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Usage & Collocations */}
      <Section title="Cách sử dụng" icon="💡">
        <div className="space-y-4">
          {/* Collocations */}
          {data.usage?.collocations && data.usage.collocations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Cụm từ kết hợp:</h4>
              <div className="grid gap-3">
                {data.usage.collocations.map((col, idx) => (
                  <CollocationCard key={idx} collocation={col} />
                ))}
              </div>
            </div>
          )}

          {/* Example Sentences */}
          {phraseData?.usage?.example_sentences ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Ví dụ:</h4>
              {phraseData.usage.example_sentences.map((ex, idx) => (
                <div key={idx} className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                  <p className="text-gray-900 mb-2 italic">"{ex.sentence}"</p>
                  <p className="text-sm text-gray-700 mb-1">→ {ex.translation}</p>
                  <p className="text-xs text-gray-600">Ngữ cảnh: {ex.context}</p>
                </div>
              ))}
            </div>
          ) : (
            data.usage?.example_sentence && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                <p className="text-gray-900 mb-2 italic">"{data.usage.example_sentence}"</p>
                <p className="text-sm text-gray-700">→ {data.usage.example_translation}</p>
              </div>
            )
          )}
        </div>
      </Section>

      {/* Pragmatics & Culture (Phrase only) */}
      {phraseData?.pragmatics_and_culture && (
        <Section title="Ngữ dụng & Văn hóa" icon="🌏">
          <div className="space-y-4">
            <InfoCard label="Mức độ trang trọng" value={phraseData.pragmatics_and_culture.formality_level} />
            <InfoCard label="Phù hợp ngữ cảnh" value={phraseData.pragmatics_and_culture.register_appropriateness} />
            
            {phraseData.pragmatics_and_culture.cultural_notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">Lưu ý văn hóa:</p>
                <p className="text-sm text-yellow-800">{phraseData.pragmatics_and_culture.cultural_notes}</p>
              </div>
            )}

            {phraseData.pragmatics_and_culture.common_mistakes && phraseData.pragmatics_and_culture.common_mistakes.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Lỗi thường gặp:</h4>
                <div className="space-y-3">
                  {phraseData.pragmatics_and_culture.common_mistakes.map((mistake, idx) => (
                    <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                      <p className="text-sm text-red-900 mb-1">❌ <span className="font-medium">{mistake.mistake}</span></p>
                      <p className="text-sm text-green-900 mb-2">✅ <span className="font-medium">{mistake.correction}</span></p>
                      <p className="text-xs text-gray-700">{mistake.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Learning Aids (Phrase only) */}
      {phraseData?.learning_aids && (
        <Section title="Hỗ trợ học tập" icon="🎓">
          <div className="space-y-4">
            {phraseData.learning_aids.memory_tips && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-2">💡 Mẹo ghi nhớ:</p>
                <p className="text-sm text-green-800">{phraseData.learning_aids.memory_tips}</p>
              </div>
            )}

            {phraseData.learning_aids.pronunciation_tips && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">🗣️ Mẹo phát âm:</p>
                <p className="text-sm text-blue-800">{phraseData.learning_aids.pronunciation_tips}</p>
              </div>
            )}

            {phraseData.learning_aids.practice_suggestions && phraseData.learning_aids.practice_suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Bài tập thực hành:</h4>
                <div className="space-y-3">
                  {phraseData.learning_aids.practice_suggestions.map((practice, idx) => (
                    <div key={idx} className="bg-purple-50 border rounded-lg p-4">
                      <p className="font-medium text-purple-900 mb-2">{practice.exercise}</p>
                      <p className="text-sm text-purple-700">{practice.instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
};

// Sentence Analysis View Component
const SentenceAnalysisView = ({ data }: { data: SentenceAnalysis }) => {
  return (
    <div className="space-y-6">
      {/* Meta Information */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-200">
        <p className="text-xl font-medium text-gray-900 mb-4 leading-relaxed italic">"{data.meta.sentence}"</p>
        <div className="flex flex-wrap gap-3">
          <MetaBadge label="Độ phức tạp" value={data.meta.complexity_level} variant="info" />
          <MetaBadge label="Loại câu" value={data.meta.sentence_type} />
        </div>
      </div>

      {/* Semantics */}
      <Section title="Ngữ nghĩa" icon="🎯">
        <div className="space-y-4">
          <DefinitionCard 
            title="Ý chính" 
            content={data.semantics.main_idea}
            variant="blue"
          />
          <DefinitionCard 
            title="Ý ẩn" 
            content={data.semantics.subtext}
            variant="purple"
          />
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Cảm xúc:</span>
              <SentimentBadge sentiment={data.semantics.sentiment} />
            </div>
          </div>
        </div>
      </Section>

      {/* Grammar Breakdown */}
      <Section title="Phân tích ngữ pháp" icon="📝">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <InfoCard label="Chủ ngữ" value={data.grammar_breakdown.subject} variant="blue" />
          <InfoCard label="Động từ chính" value={data.grammar_breakdown.main_verb} variant="green" />
          <InfoCard label="Tân ngữ" value={data.grammar_breakdown.object} variant="purple" />
        </div>

        {data.grammar_breakdown.clauses && data.grammar_breakdown.clauses.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Các mệnh đề:</h4>
            <div className="space-y-2">
              {data.grammar_breakdown.clauses.map((clause, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-3 flex items-start gap-3">
                  <span className="text-xs font-bold text-white bg-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-1">{clause.text}</p>
                    <span className="text-xs text-primary font-medium">{clause.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Contextual Role */}
      <Section title="Vai trò ngữ cảnh" icon="🔄">
        <div className="space-y-3">
          <InfoCard label="Chức năng" value={data.contextual_role.function} />
          <InfoCard label="Mối quan hệ với câu trước" value={data.contextual_role.relation_to_previous} />
        </div>
      </Section>

      {/* Key Components */}
      {data.key_components && data.key_components.length > 0 && (
        <Section title="Thành phần quan trọng" icon="⭐">
          <div className="grid gap-3">
            {data.key_components.map((component, idx) => (
              <div key={idx} className="bg-white border border-primary/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🔑</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{component.phrase}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{component.type}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{component.meaning}</p>
                    <p className="text-xs text-gray-600 italic">{component.significance}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Rewrite Suggestions */}
      {data.rewrite_suggestions && data.rewrite_suggestions.length > 0 && (
        <Section title="Gợi ý viết lại" icon="✍️">
          <div className="space-y-3">
            {data.rewrite_suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 bg-green-600 text-white rounded-full">
                    {suggestion.style}
                  </span>
                </div>
                <p className="text-gray-900 mb-3 italic">"{suggestion.text}"</p>
                <p className="text-xs text-gray-600">💡 {suggestion.change_log}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Translation */}
      <Section title="Bản dịch" icon="🌐">
        <div className="space-y-3">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-xs font-semibold text-blue-900 mb-2">Dịch trực tiếp:</p>
            <p className="text-sm text-blue-800">{data.translation.literal}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <p className="text-xs font-semibold text-green-900 mb-2">Dịch tự nhiên:</p>
            <p className="text-sm text-green-800">{data.translation.natural}</p>
          </div>
        </div>
      </Section>
    </div>
  );
};

// Paragraph Analysis View Component
const ParagraphAnalysisView = ({ data }: { data: ParagraphAnalysis }) => {
  const [expandedSentences, setExpandedSentences] = useState<Set<number>>(new Set());

  const toggleSentence = (index: number) => {
    setExpandedSentences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Meta Information */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-200">
        <div className="grid sm:grid-cols-3 gap-4">
          <MetaBadge label="Thể loại" value={data.meta.type} variant="info" />
          <MetaBadge label="Giọng điệu" value={data.meta.tone} />
          <MetaBadge label="Đối tượng" value={data.meta.target_audience} variant="success" />
        </div>
      </div>

      {/* Content Analysis */}
      <Section title="Phân tích nội dung" icon="📊">
        <div className="space-y-4">
          <DefinitionCard 
            title="Chủ đề chính" 
            content={data.content_analysis.main_topic}
            variant="blue"
          />

          <div className="bg-white border rounded-xl p-5">
            <h4 className="font-semibold text-gray-700 mb-4">Phân tích cảm xúc</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Nhãn cảm xúc:</span>
                <SentimentBadge sentiment={data.content_analysis.sentiment.label as any} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cường độ:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(data.content_analysis.sentiment.intensity / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-primary">{data.content_analysis.sentiment.intensity}/10</span>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-xs text-blue-900">{data.content_analysis.sentiment.justification}</p>
              </div>
            </div>
          </div>

          {data.content_analysis.keywords && data.content_analysis.keywords.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Từ khóa quan trọng:</h4>
              <div className="flex flex-wrap gap-2">
                {data.content_analysis.keywords.map((keyword, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white border border-orange-200 text-orange-700 rounded-full text-sm font-medium shadow-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Structure Breakdown */}
      {data.structure_breakdown && data.structure_breakdown.length > 0 && (
        <Section title="Phân tích cấu trúc" icon="🏗️">
          <div className="space-y-2">
            {data.structure_breakdown.map((sentence, idx) => (
              <div key={idx} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSentence(idx)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-bold text-white bg-primary rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {sentence.sentence_index}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm text-gray-900 truncate">{sentence.snippet}</p>
                      {expandedSentences.has(idx) ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{sentence.role}</span>
                  </div>
                </button>
                
                {expandedSentences.has(idx) && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t animate-in slide-in-from-top-2">
                    <p className="text-sm text-gray-700">{sentence.analysis}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Coherence and Cohesion */}
      <Section title="Mạch lạc & Liên kết" icon="🔗">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <ScoreCard label="Điểm mạch lạc" score={data.coherence_and_cohesion.logic_score} color="blue" />
            <ScoreCard label="Điểm trôi chảy" score={data.coherence_and_cohesion.flow_score} color="green" />
          </div>

          {data.coherence_and_cohesion.transition_words && data.coherence_and_cohesion.transition_words.length > 0 && (
            <div className="bg-purple-50 border rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">Từ nối được sử dụng:</h4>
              <div className="flex flex-wrap gap-2">
                {data.coherence_and_cohesion.transition_words.map((word, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-purple-200 text-purple-800 rounded text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.coherence_and_cohesion.gap_analysis && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm font-semibold text-amber-900 mb-2">Phân tích điểm yếu:</p>
              <p className="text-sm text-amber-800">{data.coherence_and_cohesion.gap_analysis}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Stylistic Evaluation */}
      <Section title="Đánh giá phong cách" icon="🎨">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoCard label="Vốn từ vựng" value={data.stylistic_evaluation.vocabulary_level} variant="purple" />
          <InfoCard label="Đa dạng câu" value={data.stylistic_evaluation.sentence_variety} variant="blue" />
        </div>
      </Section>

      {/* Constructive Feedback */}
      {data.constructive_feedback && (
        <Section title="Phản hồi xây dựng" icon="💬">
          <div className="space-y-4">
            {data.constructive_feedback.critiques && data.constructive_feedback.critiques.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Các vấn đề cần cải thiện:</h4>
                {data.constructive_feedback.critiques.map((critique, idx) => (
                  <div key={idx} className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-red-600 text-white rounded">
                        {critique.issue_type}
                      </span>
                    </div>
                    <p className="text-sm text-red-900 mb-2"><strong>Vấn đề:</strong> {critique.description}</p>
                    <p className="text-sm text-green-900"><strong>Đề xuất:</strong> {critique.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {data.constructive_feedback.better_version && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <h4 className="font-bold text-green-900">Phiên bản cải thiện:</h4>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed italic">
                  "{data.constructive_feedback.better_version}"
                </p>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
};

// Helper Components
const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        {title}
      </h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const MetaBadge = ({ label, value, variant = 'default' }: { label: string; value?: string; variant?: 'default' | 'success' | 'info' }) => {
  const colors = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className={cn('border rounded-lg p-3', colors[variant])}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-sm font-semibold">{value || 'N/A'}</p>
    </div>
  );
};

const DefinitionCard = ({ title, content, variant = 'blue' }: { title: string; content?: string; variant?: 'blue' | 'purple' | 'green' }) => {
  const colors = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    green: 'from-green-50 to-green-100 border-green-200'
  };

  return (
    <div className={cn('bg-gradient-to-br border rounded-lg p-4', colors[variant])}>
      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">{title}</p>
      <p className="text-sm text-gray-900 leading-relaxed">{content || 'N/A'}</p>
    </div>
  );
};

const InfoCard = ({ label, value, variant = 'default' }: { label: string; value?: string; variant?: 'default' | 'blue' | 'green' | 'purple' }) => {
  const colors = {
    default: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={cn('border rounded-lg p-4', colors[variant])}>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}:</p>
      <p className="text-sm text-gray-900 font-medium">{value || 'N/A'}</p>
    </div>
  );
};

const RelationCard = ({ item, variant }: { item: { word: string; ipa: string; meaning_en: string; meaning_vi: string }; variant: 'green' | 'red' }) => {
  const colors = {
    green: 'border-green-200 hover:bg-green-50',
    red: 'border-red-200 hover:bg-red-50'
  };

  return (
    <div className={cn('bg-white border rounded-lg p-3 transition-colors', colors[variant])}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{item.word}</span>
            <span className="text-xs text-gray-500">{item.ipa}</span>
          </div>
          <p className="text-xs text-gray-700 mb-1">{item.meaning_en}</p>
          <p className="text-xs text-gray-600 italic">{item.meaning_vi}</p>
        </div>
      </div>
    </div>
  );
};

const CollocationCard = ({ collocation }: { collocation: { phrase: string; meaning: string; usage_example?: string; frequency_level: string } }) => {
  const levelColors = {
    common: 'bg-green-100 text-green-700',
    uncommon: 'bg-yellow-100 text-yellow-700',
    rare: 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="font-semibold text-blue-900">{collocation.phrase}</span>
        <span className={cn('text-xs px-2 py-1 rounded font-medium flex-shrink-0', levelColors[collocation.frequency_level as keyof typeof levelColors])}>
          {collocation.frequency_level}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{collocation.meaning}</p>
      {collocation.usage_example && (
        <p className="text-xs text-gray-600 italic">"{collocation.usage_example}"</p>
      )}
    </div>
  );
};

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const colors = {
    Positive: 'bg-green-100 text-green-700 border-green-200',
    Negative: 'bg-red-100 text-red-700 border-red-200',
    Neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    Mixed: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  return (
    <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', colors[sentiment as keyof typeof colors] || colors.Neutral)}>
      {sentiment}
    </span>
  );
};

const ScoreCard = ({ label, score, color }: { label: string; score?: number; color: 'blue' | 'green' | 'purple' }) => {
  const colors = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
    green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' }
  };

  const colorScheme = colors[color];
  const percentage = score || 0;

  return (
    <div className={cn('rounded-lg p-4 border', colorScheme.light)}>
      <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', colorScheme.bg)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn('text-lg font-bold', colorScheme.text)}>{percentage}</span>
      </div>
    </div>
  );
};

export function AnalysisResultDialog({
  isOpen,
  onClose,
  analysis,
  analysisType,
  originalText,
  processingTime,
  tokensUsed,
  model,
  provider,
  meta
}: AnalysisResultDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialogWidth, setDialogWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  const metadata = useMemo(() => {
    if (meta) return meta;
    return {
      processingTime,
      tokensUsed,
      model,
      provider
    };
  }, [meta, processingTime, tokensUsed, model, provider]);

  const { handleExport, handlePrint, handleShare } = useAnalysisActions({
    analysis,
    analysisType,
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
    metadata
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePrint();
          }
          break;
        case 'e':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleExport();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, handleExport, handlePrint]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = dialogRef.current?.offsetWidth || 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = window.innerWidth < 768 ? window.innerWidth * 0.9 : 600;
      const maxWidth = window.innerWidth * 0.95;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setDialogWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setDialogWidth(null);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerWidth < 768) {
        setDialogWidth(null);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onShareClick = async () => {
    const result = await handleShare();
    if (result.method === 'clipboard' || result.method === 'share') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Icon = useMemo(() => {
    if (analysisType === 'word') return BookOpen;
    if (analysisType === 'phrase') return BookOpen;
    if (analysisType === 'sentence') return AlignLeft;
    return FileText;
  }, [analysisType]);

  if (!analysis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={dialogRef}
        size={isFullscreen ? "fullscreen" : (windowWidth < 768 ? "default" : "xlarge")}
        className={cn(
          "flex flex-col p-0 gap-0 transition-all duration-300",
          isFullscreen
            ? "rounded-none border-0"
            : "h-[85vh] sm:rounded-xl",
          dialogWidth && !isFullscreen && "max-w-none"
        )}
        style={{
          width: dialogWidth && !isFullscreen && windowWidth >= 768 ? `${dialogWidth}px` : undefined
        }}
        showCloseButton={false}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-muted/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <DialogTitle className="text-lg font-semibold leading-none">Kết quả phân tích</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                   {analysisType === 'word' ? 'Từ vựng' : analysisType === 'phrase' ? 'Cụm từ' : analysisType === 'sentence' ? 'Câu văn' : 'Đoạn văn'}
                </DialogDescription>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-normal gap-2">
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleExport()} title="Export (Ctrl+E)" className="h-8 w-8">
                    <Download className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handlePrint()} title="Print (Ctrl+P)" className="h-8 w-8">
                    <Printer className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onShareClick} title="Share" className="h-8 w-8">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-muted-foreground" />}
                </Button>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen (Ctrl+F)" className="h-8 w-8">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
             </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            {originalText && (
                <div className="px-4 py-2 bg-background border-b flex justify-between items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-2"
                        onClick={() => setShowOriginal(!showOriginal)}
                    >
                       <FileText className="w-3 h-3" />
                       {showOriginal ? 'Ẩn văn bản gốc' : 'Xem văn bản gốc'}
                    </Button>
                </div>
            )}

            <ScrollArea className="flex-1 h-full">
                 <div className="p-4 md:p-6 max-w-6xl mx-auto" ref={contentRef}>
                     {showOriginal && originalText && (
                         <div className="mb-6 p-5 bg-white border-2 border-blue-200 rounded-xl shadow-sm animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-3">
                                 <FileText className="w-4 h-4 text-blue-600" />
                                 <h4 className="text-sm font-bold text-blue-900 uppercase">Văn bản gốc</h4>
                             </div>
                             <p className="text-sm text-gray-800 leading-relaxed italic bg-blue-50 p-4 rounded-lg">"{originalText}"</p>
                         </div>
                     )}

                     <div className="mt-0 h-full">
                        {(analysisType === 'word' || analysisType === 'phrase') && (
                          <WordPhraseAnalysisView data={analysis as WordAnalysis | PhraseAnalysis} type={analysisType} />
                        )}
                        {analysisType === 'sentence' && <SentenceAnalysisView data={analysis as SentenceAnalysis} />}
                        {analysisType === 'paragraph' && <ParagraphAnalysisView data={analysis as ParagraphAnalysis} />}
                     </div>
                 </div>
            </ScrollArea>
        </div>
        
        {!isFullscreen && windowWidth >= 768 && (
          <div
            ref={resizeHandleRef}
            className={cn(
              "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors",
              isResizing && "bg-primary/40"
            )}
            onMouseDown={handleMouseDown}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AnalysisResultDialog;