import React from 'react';
import { Maximize2, Minimize2, Download, Share2, Printer, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportFormat } from '../types/dialog-types';

interface AnalysisDialogHeaderWithIconTitleAndActionsComponentProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  onExport?: (analysis: any, format?: ExportFormat) => void;
  onShare?: (analysis: any) => void;
  onPrint?: (analysis: any) => void;
  onCopy?: (text: string) => void;
  analysis?: any;
}

export const AnalysisDialogHeaderWithIconTitleAndActionsComponent: React.FC<AnalysisDialogHeaderWithIconTitleAndActionsComponentProps> = ({
  title,
  subtitle,
  icon,
  isFullscreen,
  onFullscreenToggle,
  onExport,
  onShare,
  onPrint,
  onCopy,
  analysis
}) => {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
          {icon || <div className="text-primary font-bold">A</div>}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title || "Analysis"}</h2>
          {/* {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )} */}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onFullscreenToggle}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
        
        {/* Export Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('🐛 DEBUG: Export button clicked', {
              hasHandler: !!onExport,
              hasAnalysis: !!analysis,
              analysisType: analysis?.word ? 'word' : analysis?.sentence ? 'sentence' : analysis?.phrase ? 'phrase' : analysis?.paragraph ? 'paragraph' : 'unknown',
              timestamp: new Date().toISOString()
            });
            
            if (onExport && analysis) {
              onExport(analysis, 'json' as ExportFormat); // Default format to JSON
            } else {
              console.log('Export action triggered - no handler or analysis data');
            }
          }}
          aria-label="Export"
        >
          <Download className="h-5 w-5" />
        </Button>
        
        {/* Share Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('🐛 DEBUG: Share button clicked', {
              hasHandler: !!onShare,
              hasAnalysis: !!analysis,
              timestamp: new Date().toISOString()
            });
            
            if (onShare && analysis) {
              onShare(analysis);
            } else {
              console.log('Share action triggered - no handler or analysis data');
            }
          }}
          aria-label="Share"
        >
          <Share2 className="h-5 w-5" />
        </Button>
        
        {/* Print Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('🐛 DEBUG: Print button clicked', {
              hasHandler: !!onPrint,
              hasAnalysis: !!analysis,
              timestamp: new Date().toISOString()
            });
            
            if (onPrint && analysis) {
              onPrint(analysis);
            } else {
              console.log('Print action triggered - using fallback');
              window.print(); // Fallback to default print
            }
          }}
          aria-label="Print"
        >
          <Printer className="h-5 w-5" />
        </Button>
        
        {/* Copy Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            console.log('🐛 DEBUG: Copy button clicked', {
              hasHandler: !!onCopy,
              hasAnalysis: !!analysis,
              timestamp: new Date().toISOString()
            });
            
            if (onCopy && analysis) {
              // Extract text content based on analysis type
              let textToCopy = '';
              if (analysis.word) {
                textToCopy = analysis.word;
              } else if (analysis.sentence) {
                textToCopy = analysis.sentence;
              } else if (analysis.phrase) {
                textToCopy = analysis.phrase;
              } else if (analysis.paragraph) {
                textToCopy = analysis.paragraph;
              } else {
                textToCopy = JSON.stringify(analysis, null, 2);
              }
              
              try {
                console.log('🐛 DEBUG: Copying text to clipboard', { textLength: textToCopy.length });
                await navigator.clipboard.writeText(textToCopy);
                console.log('🐛 DEBUG: Calling onCopy callback');
                onCopy(textToCopy);
              } catch (error) {
                console.error('Failed to copy text:', error);
              }
            } else {
              console.log('Copy action triggered - no handler or analysis data');
            }
          }}
          aria-label="Copy"
        >
          <Copy className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};