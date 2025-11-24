import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { ParagraphAnalysis } from '@/lib/ai/types';
import { Section, MetaBadge, DefinitionCard, InfoCard, SentimentBadge, ScoreCard } from './AnalysisResultHelpers';

interface ParagraphAnalysisViewProps {
  data: ParagraphAnalysis;
}

export function ParagraphAnalysisView({ data }: ParagraphAnalysisViewProps) {
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
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-border">
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
            variant="default"
          />

          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-4">Phân tích cảm xúc</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Nhãn cảm xúc:</span>
                <SentimentBadge sentiment={data.content_analysis.sentiment.label as any} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Cường độ:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                      style={{ width: `${(data.content_analysis.sentiment.intensity / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-primary">{data.content_analysis.sentiment.intensity}/10</span>
                </div>
              </div>
              <div className="bg-muted/50 border-l-4 border-border p-3 rounded">
                <p className="text-xs text-muted-foreground">{data.content_analysis.sentiment.justification}</p>
              </div>
            </div>
          </div>

          {data.content_analysis.keywords && data.content_analysis.keywords.length > 0 && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-3">Từ khóa quan trọng:</h4>
              <div className="flex flex-wrap gap-2">
                {data.content_analysis.keywords.map((keyword, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-card border border-border text-foreground rounded-full text-sm font-medium shadow-sm">
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
              <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSentence(idx)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-bold text-primary-foreground bg-primary rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {sentence.sentence_index}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm text-foreground truncate">{sentence.snippet}</p>
                      {expandedSentences.has(idx) ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{sentence.role}</span>
                  </div>
                </button>
                
                {expandedSentences.has(idx) && (
                  <div className="px-4 pb-4 pt-2 bg-muted/30 border-t border-border animate-in slide-in-from-top-2">
                    <p className="text-sm text-muted-foreground">{sentence.analysis}</p>
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
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-3">Từ nối được sử dụng:</h4>
              <div className="flex flex-wrap gap-2">
                {data.coherence_and_cohesion.transition_words.map((word, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.coherence_and_cohesion.gap_analysis && (
            <div className="bg-muted/50 border-l-4 border-border p-4 rounded">
              <p className="text-sm font-semibold text-foreground mb-2">Phân tích điểm yếu:</p>
              <p className="text-sm text-muted-foreground">{data.coherence_and_cohesion.gap_analysis}</p>
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
                <h4 className="font-semibold text-foreground">Các vấn đề cần cải thiện:</h4>
                {data.constructive_feedback.critiques.map((critique, idx) => (
                  <div key={idx} className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-destructive text-destructive-foreground rounded">
                        {critique.issue_type}
                      </span>
                    </div>
                    <p className="text-sm text-destructive-foreground mb-2"><strong>Vấn đề:</strong> {critique.description}</p>
                    <p className="text-sm text-primary"><strong>Đề xuất:</strong> {critique.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {data.constructive_feedback.better_version && (
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <h4 className="font-bold text-foreground">Phiên bản cải thiện:</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{data.constructive_feedback.better_version}"
                </p>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

export default ParagraphAnalysisView;