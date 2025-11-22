import React from 'react';
import { 
  BookOpen, Lightbulb, Zap, Languages, Target, 
  TrendingUp, BarChart3, AlertTriangle, CheckCircle2, Split,
  Brain, FileText, Hash, ArrowRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

// --- TYPESCRIPT INTERFACES ---

interface BaseAnalysisProps {
  data: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  className?: string;
}

interface SectionTitleProps {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

interface SentimentBadgeProps {
  sentiment: string;
  className?: string;
}

interface ProgressIndicatorProps {
  value: number;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

interface AnalysisCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'warning' | 'success';
}

// --- HELPER COMPONENTS ---

export const SectionTitle: React.FC<SectionTitleProps> = ({ icon: Icon, children, className }) => (
  <div className={cn("flex items-center gap-2 mb-3 text-primary font-semibold", className)}>
    <Icon className="h-4 w-4" />
    <h4 className="text-sm uppercase tracking-wider">{children}</h4>
  </div>
);

export const InfoItem: React.FC<InfoItemProps> = ({ label, value, className }) => (
  <div className={cn("space-y-1", className)}>
    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
    <div className="text-sm font-medium leading-relaxed">{value}</div>
  </div>
);

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment, className }) => {
  const color =
    sentiment.includes('Positive') ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300' :
    sentiment.includes('Negative') ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300' :
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", color, className)}
    >
      {sentiment}
    </Badge>
  );
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  label,
  color = 'primary',
  className
}) => {
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500'
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-xs font-bold">{value}%</span>
      </div>
      <div className="relative">
        <Progress
          value={value}
          className="h-2"
        />
        <div
          className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  title,
  icon: Icon,
  description,
  children,
  className,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'border-border bg-card',
    highlighted: 'border-primary/20 bg-primary/5',
    warning: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10',
    success: 'border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10'
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-md group",
      variantStyles[variant],
      className
    )}>
      {(title || Icon) && (
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className={cn("text-base flex items-center gap-2", Icon && "font-semibold")}>
              {Icon && <Icon className="w-4 h-4" />}
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

// --- WORD ANALYSIS VIEW ---

export const WordAnalysisView: React.FC<{ data: WordAnalysis }> = ({ data }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Header Card: Từ vựng, IPA, Loại từ */}
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 border rounded-xl p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-primary">{data.meta.word}</h1>
            <span className="text-xl font-mono text-muted-foreground font-normal">/{data.meta.ipa}/</span>
          </div>
          <p className="text-muted-foreground capitalize">{data.definitions.root_meaning}</p>
        </div>
        <div className="flex gap-2">
          <Badge className="text-lg px-4 py-1 bg-primary/10 text-primary border-primary/20">
            {data.meta.pos}
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-1 border-primary text-primary">
            {data.meta.cefr}
          </Badge>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cột Trái: Định nghĩa & Dịch */}
      <div className="space-y-6">
        <AnalysisCard 
          title="Ý Nghĩa" 
          icon={Brain}
          description="Phân tích chi tiết nghĩa của từ"
        >
          <div className="space-y-4">
            <InfoItem 
              label="Trong ngữ cảnh này" 
              value={
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900 text-blue-800 dark:text-blue-200 transition-all hover:shadow-sm">
                  {data.definitions.context_meaning}
                </div>
              } 
            />
            <InfoItem label="Dịch tiếng Việt" value={data.definitions.vietnamese_translation} />
            <Separator />
            <SectionTitle icon={Zap}>Chiến lược suy luận</SectionTitle>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Hash className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Dấu hiệu:</span>
                  <span className="text-muted-foreground ml-1">{data.inference_strategy.clues}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Suy luận:</span>
                  <span className="text-muted-foreground ml-1">{data.inference_strategy.reasoning}</span>
                </div>
              </div>
            </div>
          </div>
        </AnalysisCard>
        
        <AnalysisCard 
          title="Quan hệ từ" 
          icon={Languages}
          description="Từ đồng nghĩa và trái nghĩa"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider block mb-2">Đồng nghĩa</span>
              <div className="flex flex-wrap gap-2">
                {data.relations.synonyms.map((s, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="hover:bg-green-50 dark:hover:bg-green-900/20 cursor-help transition-colors border-green-200 dark:border-green-800" 
                    title={s.meaning_vi}
                  >
                    {s.word}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block mb-2">Trái nghĩa</span>
              <div className="flex flex-wrap gap-2">
                {data.relations.antonyms.map((s, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 cursor-help transition-colors border-red-200 dark:border-red-800" 
                    title={s.meaning_vi}
                  >
                    {s.word}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </AnalysisCard>
      </div>

      {/* Cột Phải: Cách dùng & Collocation */}
      <div className="space-y-6">
        <AnalysisCard 
          title="Ứng dụng" 
          icon={BookOpen}
          description="Cách sử dụng và cụm từ đi kèm"
        >
          <div className="space-y-6">
            <InfoItem 
              label="Ví dụ mẫu" 
              value={
                <div className="relative bg-muted/50 p-4 rounded-lg border-l-4 border-primary transition-all hover:shadow-sm">
                  <Sparkles className="absolute top-2 right-2 w-4 h-4 text-primary/50" />
                  <p className="italic text-foreground">"{data.usage.example_sentence}"</p>
                  <div className="mt-2 text-sm not-italic text-muted-foreground">
                    {data.usage.example_translation}
                  </div>
                </div>
              } 
            />
            
            <div>
              <SectionTitle icon={Target}>Collocations (Cụm từ)</SectionTitle>
              <div className="space-y-2">
                {data.usage.collocations.map((col, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <span className="font-medium group-hover:text-primary transition-colors">{col.phrase}</span>
                    <Badge 
                      variant={col.frequency_level === 'common' ? 'default' : 'secondary'} 
                      className="text-[10px] uppercase tracking-wide"
                    >
                      {col.frequency_level}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnalysisCard>
      </div>
    </div>
  </div>
);

// --- SENTENCE ANALYSIS VIEW ---

export const SentenceAnalysisView: React.FC<{ data: SentenceAnalysis }> = ({ data }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Overview Banner */}
    <div className="relative overflow-hidden bg-muted/30 border rounded-xl p-6">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      <div className="relative flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-serif italic text-foreground/80 leading-relaxed">
            "{data.meta.sentence}"
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={data.meta.complexity_level === 'Advanced' ? 'destructive' : 'secondary'}
              className="transition-all hover:scale-105"
            >
              {data.meta.complexity_level}
            </Badge>
            <Badge variant="outline" className="transition-all hover:scale-105">
              {data.meta.sentence_type}
            </Badge>
            <SentimentBadge sentiment={data.semantics?.sentiment || 'N/A'} />
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Cột 1: Grammar Tree (Chiếm 2 phần) */}
      <div className="xl:col-span-2 space-y-6">
        <AnalysisCard 
          title="Cấu trúc ngữ pháp" 
          icon={Split}
          description="Phân tích thành phần câu"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-100 dark:border-blue-800 transition-all hover:shadow-sm">
                <div className="text-xs text-blue-600 dark:text-blue-300 font-bold mb-1 uppercase tracking-wide">Chủ ngữ</div>
                <div className="font-medium text-sm">{data.grammar_breakdown?.subject || 'N/A'}</div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center border border-orange-100 dark:border-orange-800 transition-all hover:shadow-sm">
                <div className="text-xs text-orange-600 dark:text-orange-300 font-bold mb-1 uppercase tracking-wide">Động từ</div>
                <div className="font-medium text-sm">{data.grammar_breakdown?.main_verb || 'N/A'}</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-100 dark:border-green-800 transition-all hover:shadow-sm">
                <div className="text-xs text-green-600 dark:text-green-300 font-bold mb-1 uppercase tracking-wide">Tân ngữ</div>
                <div className="font-medium text-sm">{data.grammar_breakdown?.object || 'N/A'}</div>
              </div>
            </div>
            
            <SectionTitle icon={Target}>Thành phần chi tiết</SectionTitle>
            <div className="space-y-3">
              {data.grammar_breakdown?.clauses?.map((clause, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Badge 
                    variant="outline" 
                    className="mt-0.5 whitespace-nowrap bg-primary/5 border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    {clause.type}
                  </Badge>
                  <span className="text-sm leading-relaxed">{clause.text}</span>
                </div>
              ))}
            </div>
          </div>
        </AnalysisCard>

        {/* Rewrite Suggestions */}
        {data.rewrite_suggestions && data.rewrite_suggestions.length > 0 && (
          <AnalysisCard
            title="Gợi ý viết lại"
            icon={Lightbulb}
            description="Các phương án diễn đạt khác"
            variant="success"
          >
            <div className="space-y-4">
              {data.rewrite_suggestions?.map((sug, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-background rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex justify-between items-center mb-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                    >
                      {sug.style}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-medium mb-2 leading-relaxed">{sug.text}</p>
                  <p className="text-xs text-muted-foreground italic">{sug.change_log}</p>
                </div>
              ))}
            </div>
          </AnalysisCard>
        )}
      </div>

      {/* Cột 2: Semantics & Translation */}
      <div className="space-y-6">
        <AnalysisCard 
          title="Ngữ nghĩa" 
          icon={Brain}
          description="Phân tích ý nghĩa câu"
        >
          <div className="space-y-4">
            <InfoItem label="Ý chính" value={data.semantics?.main_idea || 'N/A'} />
            <InfoItem
              label="Ý ngầm (Subtext)"
              value={data.semantics?.subtext || 'N/A'}
              className="text-muted-foreground italic"
            />
            <Separator />
            <InfoItem label="Chức năng" value={data.contextual_role?.function || 'N/A'} />
          </div>
        </AnalysisCard>

        <AnalysisCard 
          title="Dịch thuật" 
          icon={Languages}
          description="Bản dịch và diễn giải"
        >
          <div className="space-y-4">
            <InfoItem
              label="Nghĩa tự nhiên"
              value={<span className="font-medium text-primary">{data.translation?.natural || 'N/A'}</span>}
            />
            <InfoItem
              label="Nghĩa đen"
              value={data.translation?.literal || 'N/A'}
              className="opacity-80"
            />
          </div>
        </AnalysisCard>
      </div>
    </div>
  </div>
);

// --- PARAGRAPH ANALYSIS VIEW ---

export const ParagraphAnalysisView: React.FC<{ data: ParagraphAnalysis }> = ({ data }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Top Stats Dashboard */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-background border-primary/20 transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-primary uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Chủ đề chính
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-lg leading-snug mb-3">{data.content_analysis.main_topic}</p>
          <div className="flex flex-wrap gap-2">
            {data.content_analysis.keywords.map(k => (
              <Badge 
                key={k} 
                variant="secondary" 
                className="bg-background/80 hover:bg-background transition-colors"
              >
                {k}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Logic & Mạch lạc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressIndicator 
            value={data.coherence_and_cohesion.logic_score} 
            label="Logic" 
            color="primary"
          />
          <ProgressIndicator 
            value={data.coherence_and_cohesion.flow_score} 
            label="Flow" 
            color="success"
          />
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tổng quan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Thể loại</span>
            <span className="font-medium text-sm">{data.meta.type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tone</span>
            <span className="font-medium text-sm">{data.meta.tone}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Cảm xúc</span>
            <Badge variant="outline" className="text-xs">
              {data.content_analysis.sentiment.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Structure & Flow (Left) */}
      <div className="xl:col-span-2 space-y-6">
        {/* Constructive Feedback - Highlighted */}
        <AnalysisCard 
          title="Góp ý cải thiện" 
          icon={Lightbulb}
          description="Phân tích và gợi ý nâng cao"
          variant="warning"
        >
          <div className="space-y-4">
            {data.constructive_feedback.critiques.map((crit, idx) => (
              <div 
                key={idx} 
                className="flex gap-3 items-start p-4 bg-background/80 rounded-lg border border-amber-100 dark:border-amber-800/50 transition-all hover:shadow-sm group"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className="text-[10px] uppercase tracking-wide bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300"
                    >
                      {crit.issue_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{crit.description}</p>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {crit.suggestion}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="mt-6 pt-4 border-t border-amber-200/50">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Phiên bản tốt hơn
              </h5>
              <div className="bg-background p-4 rounded-lg text-sm leading-relaxed border-l-4 border-green-500 shadow-sm transition-all hover:shadow-md">
                {data.constructive_feedback.better_version}
              </div>
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard 
          title="Phân tích cấu trúc" 
          icon={BarChart3}
          description="Chi tiết từng câu trong đoạn văn"
        >
          <div className="space-y-1">
            {data.structure_breakdown.map((item, idx) => (
              <div 
                key={idx} 
                className="flex gap-4 p-4 rounded-lg hover:bg-muted/50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.sentence_index}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] bg-primary/10 text-primary border-primary/20"
                    >
                      {item.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                      "{item.snippet}..."
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{item.analysis}</p>
                </div>
              </div>
            ))}
          </div>
        </AnalysisCard>
      </div>

      {/* Stylistic & Details (Right) */}
      <div className="space-y-6">
        <AnalysisCard 
          title="Phong cách" 
          icon={TrendingUp}
          description="Đánh giá văn phong và kỹ thuật"
        >
          <div className="space-y-4">
            <InfoItem label="Vốn từ" value={data.stylistic_evaluation.vocabulary_level} />
            <InfoItem label="Đa dạng câu" value={data.stylistic_evaluation.sentence_variety} />
            <InfoItem label="Đối tượng đọc" value={data.meta.target_audience} />
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 block">
                Từ nối sử dụng
              </span>
              <div className="flex flex-wrap gap-1">
                {data.coherence_and_cohesion.transition_words.map((w, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="bg-muted/50 hover:bg-muted transition-colors text-xs"
                  >
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </AnalysisCard>

        {data.coherence_and_cohesion.gap_analysis && (
          <AnalysisCard 
            title="Lỗ hổng mạch văn" 
            icon={AlertTriangle}
            description="Phân tích điểm yếu kết nối"
            variant="warning"
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.coherence_and_cohesion.gap_analysis}
            </p>
          </AnalysisCard>
        )}
      </div>
    </div>
  </div>
);