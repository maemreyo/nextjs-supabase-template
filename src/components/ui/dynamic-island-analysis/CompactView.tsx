import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AnalysisItem } from './types';

interface CompactViewProps {
  item: AnalysisItem;
  queueLength: number;
}

export const CompactView: React.FC<CompactViewProps> = React.memo(({ item, queueLength }) => {
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
        return 'bg-gradient-to-r from-blue-600 to-purple-600';
      case 'phrase':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'sentence':
        return 'bg-gradient-to-r from-green-600 to-teal-600';
      case 'paragraph':
        return 'bg-gradient-to-r from-orange-600 to-red-600';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center justify-center gap-2 h-[44px] px-4 rounded-full border backdrop-blur-md transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer',
          variantClasses[item.variant || 'default'],
          getAnalysisGradient(item.analysisData?.type)
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* Icon */}
        <div className="scale-90">
          {item.icon}
        </div>
        
        {/* Pulse dot for active states */}
        {(item.state === 'loading' || item.state === 'success') && (
          <div className="relative">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
            <div className="absolute inset-0 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
          </div>
        )}
        
        {/* Queue count indicator */}
        {queueLength > 0 && (
          <span className="text-xs font-medium">
            +{queueLength}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

CompactView.displayName = 'CompactView';