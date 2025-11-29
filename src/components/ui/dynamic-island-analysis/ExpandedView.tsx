import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AnalysisItem } from './types';
import type { WordAnalysis, PhraseAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

// Type guards
const isWordAnalysis = (data: any): data is WordAnalysis => {
  return data && data.meta && 'word' in data.meta && 'cefr' in data.meta;
};

const isPhraseAnalysis = (data: any): data is PhraseAnalysis => {
  return data && data.meta && 'phrase' in data.meta && 'register' in data.meta;
};

const isSentenceAnalysis = (data: any): data is SentenceAnalysis => {
  return data && data.meta && 'sentence' in data.meta && 'complexity_level' in data.meta;
};

const isParagraphAnalysis = (data: any): data is ParagraphAnalysis => {
  return data && data.meta && 'type' in data.meta && 'target_audience' in data.meta;
};

interface ExpandedViewProps {
  item: AnalysisItem;
  onDismiss: () => void;
}

export const ExpandedView: React.FC<ExpandedViewProps> = React.memo(({ item, onDismiss }) => {
  const variantClasses = {
    default: 'bg-zinc-900/90 text-white border-zinc-700',
    success: 'bg-green-900/90 text-white border-green-700',
    error: 'bg-red-900/90 text-white border-red-700',
    loading: 'bg-blue-900/90 text-white border-blue-700',
    info: 'bg-zinc-900/90 text-white border-zinc-700',
  };
  
  // Analysis type gradients
  const getAnalysisGradient = (type?: string) => {
    switch (type) {
      case 'word':
        return 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 border-purple-500/30';
      case 'phrase':
        return 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 border-pink-500/30';
      case 'sentence':
        return 'bg-gradient-to-r from-green-600/20 to-teal-600/20 border-green-500/30 border-teal-500/30';
      case 'paragraph':
        return 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30 border-red-500/30';
      default:
        return '';
    }
  };

  const renderContent = () => {
    switch (item.state) {
      case 'loading':
        return (
          <div className="w-full">
            <p className="text-sm mb-2">Analyzing...</p>
            {item.progress !== undefined && (
              <Progress value={item.progress} className="h-1" />
            )}
          </div>
        );
        
      case 'error':
        return (
          <div className="w-full">
            <p className="text-sm text-zinc-400">{item.errorMsg || 'An error occurred'}</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="w-full">
            {item.analysisData && (
              <div className="space-y-3">
                {/* Badges for analysis type */}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-white/10 rounded text-xs">
                    {item.analysisData.type}
                  </span>
                  
                  {item.analysisData.type === 'word' && isWordAnalysis(item.analysisData.data) && (
                    <span className="px-2 py-1 bg-white/10 rounded text-xs">
                      {item.analysisData.data.meta.cefr}
                    </span>
                  )}
                  
                  {item.analysisData.type === 'sentence' && isSentenceAnalysis(item.analysisData.data) && (
                    <span className="px-2 py-1 bg-white/10 rounded text-xs">
                      {item.analysisData.data.meta.complexity_level}
                    </span>
                  )}
                </div>
                
                {/* Metrics based on analysis type */}
                {item.analysisData.type === 'word' && isWordAnalysis(item.analysisData.data) && (
                  <div className="text-xs space-y-1">
                    <p>Synonyms: {item.analysisData.data.relations.synonyms.length}</p>
                    <p>Sentiment: {item.analysisData.data.meta.tone}</p>
                  </div>
                )}
                
                {item.analysisData.type === 'sentence' && isSentenceAnalysis(item.analysisData.data) && (
                  <div className="text-xs space-y-1">
                    <p>Sentiment: {item.analysisData.data.semantics.sentiment}</p>
                    <p>Type: {item.analysisData.data.meta.sentence_type}</p>
                  </div>
                )}
                
                {item.analysisData.type === 'paragraph' && isParagraphAnalysis(item.analysisData.data) && (
                  <div className="text-xs space-y-1">
                    <p>Sentiment: {item.analysisData.data.content_analysis.sentiment.label}</p>
                    <p>Type: {item.analysisData.data.meta.type}</p>
                  </div>
                )}
                
                {item.analysisData.type === 'phrase' && isPhraseAnalysis(item.analysisData.data) && (
                  <div className="text-xs space-y-1">
                    <p>Type: {item.analysisData.data.meta.type}</p>
                    <p>Register: {item.analysisData.data.meta.register}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Action button */}
            {item.action && (
              <button
                onClick={() => {
                  item.action?.onClick();
                  onDismiss();
                }}
                className="mt-3 px-4 py-1.5 bg-white/10 rounded text-sm hover:bg-white/20 transition-colors"
              >
                {item.action.label}
              </button>
            )}
          </div>
        );
        
      default:
        return (
          <div className="w-full">
            <p className="text-sm">{item.description || item.title}</p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        className={cn(
          'p-4 flex gap-3 items-start rounded-lg border backdrop-blur-md max-w-sm transition-all duration-200 hover:shadow-lg',
          variantClasses[item.variant || 'default'],
          getAnalysisGradient(item.analysisData?.type)
        )}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {item.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
          {renderContent()}
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
});

ExpandedView.displayName = 'ExpandedView';