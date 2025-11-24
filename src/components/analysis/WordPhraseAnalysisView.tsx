import React from 'react';
import { cn } from "@/lib/utils";
import type { WordAnalysis, PhraseAnalysis } from '@/lib/ai/types';
import { Section, MetaBadge, DefinitionCard, InfoCard, RelationCard, CollocationCard } from './AnalysisResultHelpers';

interface WordPhraseAnalysisViewProps {
  data: WordAnalysis | PhraseAnalysis;
  type: 'word' | 'phrase';
}

export function WordPhraseAnalysisView({ data, type }: WordPhraseAnalysisViewProps) {
  const isPhrase = type === 'phrase';
  const phraseData = isPhrase ? (data as PhraseAnalysis) : null;
  const wordData = !isPhrase ? (data as WordAnalysis) : null;

  return (
    <div className="space-y-6">
      {/* Meta Information */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-border">
        <h2 className="text-3xl font-bold text-foreground mb-4">{isPhrase ? phraseData?.meta.phrase : wordData?.meta.word}</h2>
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
              variant="default"
            />
            <DefinitionCard
              title="Nghĩa bóng"
              content={phraseData.definitions.figurative_meaning}
              variant="secondary"
            />
            <DefinitionCard
              title="Dịch tiếng Việt"
              content={phraseData.definitions.vietnamese_translation}
              variant="accent"
            />
            {phraseData.definitions.usage_notes && (
              <div className="bg-muted/50 border-l-4 border-border p-4 rounded">
                <p className="text-sm text-muted-foreground">
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
              variant="default"
            />
            <DefinitionCard
              title="Nghĩa trong ngữ cảnh"
              content={wordData?.definitions.context_meaning}
              variant="secondary"
            />
            <DefinitionCard
              title="Dịch tiếng Việt"
              content={wordData?.definitions.vietnamese_translation}
              variant="accent"
            />
          </div>
        )}
      </Section>

      {/* Components (Phrase only) */}
      {phraseData?.components && (
        <Section title="Thành phần cấu tạo" icon="🔤">
          <div className="grid gap-3">
            {phraseData.components.words.map((word, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg text-foreground">{word.word}</span>
                      <span className="text-sm text-muted-foreground">{word.ipa}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{word.meaning}</p>
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
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-foreground mb-1">Mẫu câu:</p>
            <p className="text-muted-foreground">{phraseData.grammar_and_structure.pattern}</p>
          </div>
          
          {phraseData.grammar_and_structure.variations && phraseData.grammar_and_structure.variations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Các biến thể:</h4>
              {phraseData.grammar_and_structure.variations.map((variation, idx) => (
                <div key={idx} className="bg-muted/30 border border-border rounded-lg p-4">
                  <p className="font-medium text-foreground mb-2">{variation.phrase}</p>
                  <p className="text-sm text-muted-foreground mb-2">{variation.meaning}</p>
                  <p className="text-sm text-muted-foreground italic">"{variation.usage_example}"</p>
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
            <div className="bg-muted/50 border-l-4 border-border p-4 rounded">
              <p className="text-sm font-semibold text-foreground mb-2">Manh mối:</p>
              <p className="text-sm text-muted-foreground">{wordData.inference_strategy.clues}</p>
            </div>
            <div className="bg-muted/50 border-l-4 border-border p-4 rounded">
              <p className="text-sm font-semibold text-foreground mb-2">Lý luận:</p>
              <p className="text-sm text-muted-foreground">{wordData.inference_strategy.reasoning}</p>
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
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
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
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
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
              <h4 className="font-semibold text-foreground mb-3">Cụm từ kết hợp:</h4>
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
              <h4 className="font-semibold text-foreground">Ví dụ:</h4>
              {phraseData.usage.example_sentences.map((ex, idx) => (
                <div key={idx} className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-foreground mb-2 italic">"{ex.sentence}"</p>
                  <p className="text-sm text-muted-foreground mb-1">→ {ex.translation}</p>
                  <p className="text-xs text-muted-foreground">Ngữ cảnh: {ex.context}</p>
                </div>
              ))}
            </div>
          ) : (
            wordData && 'example_sentence' in data.usage && data.usage.example_sentence && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-foreground mb-2 italic">"{data.usage.example_sentence}"</p>
                <p className="text-sm text-muted-foreground">→ {data.usage.example_translation}</p>
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
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2">Lưu ý văn hóa:</p>
                <p className="text-sm text-muted-foreground">{phraseData.pragmatics_and_culture.cultural_notes}</p>
              </div>
            )}

            {phraseData.pragmatics_and_culture.common_mistakes && phraseData.pragmatics_and_culture.common_mistakes.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Lỗi thường gặp:</h4>
                <div className="space-y-3">
                  {phraseData.pragmatics_and_culture.common_mistakes.map((mistake, idx) => (
                    <div key={idx} className="bg-destructive/10 border-l-4 border-destructive p-4 rounded">
                      <p className="text-sm text-destructive-foreground mb-1">❌ <span className="font-medium">{mistake.mistake}</span></p>
                      <p className="text-sm text-primary mb-2">✅ <span className="font-medium">{mistake.correction}</span></p>
                      <p className="text-xs text-muted-foreground">{mistake.explanation}</p>
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
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2">💡 Mẹo ghi nhớ:</p>
                <p className="text-sm text-muted-foreground">{phraseData.learning_aids.memory_tips}</p>
              </div>
            )}

            {phraseData.learning_aids.pronunciation_tips && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2">🗣️ Mẹo phát âm:</p>
                <p className="text-sm text-muted-foreground">{phraseData.learning_aids.pronunciation_tips}</p>
              </div>
            )}

            {phraseData.learning_aids.practice_suggestions && phraseData.learning_aids.practice_suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Bài tập thực hành:</h4>
                <div className="space-y-3">
                  {phraseData.learning_aids.practice_suggestions.map((practice, idx) => (
                    <div key={idx} className="bg-muted/50 border border-border rounded-lg p-4">
                      <p className="font-medium text-foreground mb-2">{practice.exercise}</p>
                      <p className="text-sm text-muted-foreground">{practice.instruction}</p>
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
}

export default WordPhraseAnalysisView;