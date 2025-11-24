import React from 'react';
import { cn } from "@/lib/utils";
import type { SentenceAnalysis } from '@/lib/ai/types';
import { Section, MetaBadge, DefinitionCard, InfoCard, SentimentBadge } from './AnalysisResultHelpers';

interface SentenceAnalysisViewProps {
  data: SentenceAnalysis;
}

export function SentenceAnalysisView({ data }: SentenceAnalysisViewProps) {
  return (
    <div className="space-y-6">
      {/* Meta Information */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border">
        <p className="text-xl font-medium text-foreground mb-4 leading-relaxed italic">"{data.meta.sentence}"</p>
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
            variant="default"
          />
          <DefinitionCard
            title="Ý ẩn"
            content={data.semantics.subtext}
            variant="secondary"
          />
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Cảm xúc:</span>
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
                <div key={idx} className="bg-card border border-border rounded-lg p-3 flex items-start gap-3">
                  <span className="text-xs font-bold text-primary-foreground bg-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground mb-1">{clause.text}</p>
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
              <div key={idx} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🔑</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">{component.phrase}</span>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{component.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{component.meaning}</p>
                    <p className="text-xs text-muted-foreground italic">{component.significance}</p>
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
              <div key={idx} className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-3 py-1 bg-primary text-primary-foreground rounded-full">
                    {suggestion.style}
                  </span>
                </div>
                <p className="text-foreground mb-3 italic">"{suggestion.text}"</p>
                <p className="text-xs text-muted-foreground">💡 {suggestion.change_log}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Translation */}
      <Section title="Bản dịch" icon="🌐">
        <div className="space-y-3">
          <div className="bg-muted/50 border-l-4 border-border p-4 rounded">
            <p className="text-xs font-semibold text-foreground mb-2">Dịch trực tiếp:</p>
            <p className="text-sm text-muted-foreground">{data.translation.literal}</p>
          </div>
          <div className="bg-muted/50 border-l-4 border-border p-4 rounded">
            <p className="text-xs font-semibold text-foreground mb-2">Dịch tự nhiên:</p>
            <p className="text-sm text-muted-foreground">{data.translation.natural}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default SentenceAnalysisView;